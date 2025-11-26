
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { type TrainingItem, type SOPBlock, type UserRole } from '../types';
import ReactQuill from 'react-quill';

// --- Robust Quill Registration ---
const FONT_WHITELIST = ['inter', 'roboto', 'playfair', 'syne', 'dela', 'noto'];
const SIZE_WHITELIST = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];

const registerQuill = () => {
    let QuillInstance: any = null;

    // 1. Try ReactQuill static property (CommonJS/ESM interop)
    if (ReactQuill && (ReactQuill as any).Quill) {
        QuillInstance = (ReactQuill as any).Quill;
    }

    // 2. Try Window global (CDN/UMD)
    if (!QuillInstance && (window as any).Quill) {
        QuillInstance = (window as any).Quill;
    }

    if (QuillInstance) {
        // Register Fonts
        const Font = QuillInstance.import('formats/font');
        Font.whitelist = FONT_WHITELIST;
        QuillInstance.register(Font, true);

        // Register Sizes
        const Size = QuillInstance.import('attributors/style/size');
        Size.whitelist = SIZE_WHITELIST;
        QuillInstance.register(Size, true);
        
        return true;
    }
    return false;
};

// Try registering immediately
registerQuill();

// Improved Auto-link Strategy
const autoLinkHtml = (html: string): string => {
    if (!html) return '';
    const container = document.createElement('div');
    container.innerHTML = html;

    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes: Node[] = [];
    while(walk.nextNode()) nodes.push(walk.currentNode);

    nodes.forEach(node => {
        if(node.parentElement && ['A', 'SCRIPT', 'STYLE', 'BUTTON', 'TEXTAREA', 'CODE', 'PRE'].includes(node.parentElement.tagName)) return;
        
        const text = node.textContent || '';
        const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
        
        if(!urlRegex.test(text)) return;

        const fragment = document.createDocumentFragment();
        let lastIdx = 0;
        let match;
        
        while ((match = urlRegex.exec(text)) !== null) {
            const before = text.slice(lastIdx, match.index);
            if(before) fragment.appendChild(document.createTextNode(before));
            
            let url = match[0];
            const href = url.startsWith('www.') ? `https://${url}` : url;
            
            const punctuation = /[.,;:!?)]+$/;
            let suffix = '';
            const pMatch = url.match(punctuation);
            if(pMatch) {
                suffix = pMatch[0];
                url = url.slice(0, -suffix.length);
            }

            const a = document.createElement('a');
            a.href = href.startsWith('www.') ? `https://${url}` : (url.startsWith('http') ? url : `https://${url}`);
            a.target = '_blank';
            a.rel = "noopener noreferrer";
            a.className = "text-pizza-500 underline hover:text-pizza-600 font-medium transition-colors";
            a.textContent = url;
            fragment.appendChild(a);
            
            if(suffix) fragment.appendChild(document.createTextNode(suffix));

            lastIdx = match.index + match[0].length;
        }
        
        const after = text.slice(lastIdx);
        if(after) fragment.appendChild(document.createTextNode(after));
        
        node.parentNode?.replaceChild(fragment, node);
    });

    return container.innerHTML;
};

const convertBlocksToHtml = (blocks: SOPBlock[]): string => {
    if (!blocks || blocks.length === 0) return '';
    const richTextBlock = blocks.find(b => b.type === 'richtext');
    if (richTextBlock) return autoLinkHtml(richTextBlock.content);

    let rawHtml = blocks.filter(b => b.type !== 'table').map(block => {
        let text = block.content || '';
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #f97316; text-decoration: underline;">$1</a>');
        
        switch (block.type) {
            case 'heading-1': return `<h1>${text}</h1>`;
            case 'heading-2': return `<h2>${text}</h2>`;
            case 'heading-3': return `<h3>${text}</h3>`;
            case 'bullet-list': return `<ul><li>${text}</li></ul>`;
            case 'number-list': return `<ol><li>${text}</li></ol>`;
            case 'image': return `<img src="${block.content}" alt="Image" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
            case 'video': return `<p><a href="${block.content}" target="_blank">📺 觀看影片</a></p>`;
            case 'pdf': return `<p><a href="${block.content}" target="_blank">📄 下載 PDF 文件</a></p>`;
            case 'divider': return `<hr />`;
            case 'callout': return `<blockquote style="border-left: 4px solid orange; padding-left: 10px; color: #666; background: #fffaf0; padding: 10px;">${text}</blockquote>`;
            default: return `<p>${text}</p>`;
        }
    }).join('');

    return autoLinkHtml(rawHtml);
};

// --- Sheet Editor Types & Components ---

interface SheetCell {
    value: string;
    style?: React.CSSProperties;
}

const normalizeSheetData = (data: any): SheetCell[][] => {
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    const isLegacy = typeof data[0][0] === 'string';
    if (isLegacy) {
        return data.map((row: any[]) => row.map(cell => ({ value: String(cell || ''), style: {} })));
    }
    return data;
};

const isImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || url.startsWith('data:image/');
};

interface SheetEditorProps {
    data: SheetCell[][];
    onChange: (data: SheetCell[][]) => void;
    readOnly?: boolean;
    onImageRequest?: () => void;
    insertImageRef?: React.MutableRefObject<((url: string) => void) | undefined>;
}

const SheetEditor: React.FC<SheetEditorProps> = ({ data, onChange, readOnly, onImageRequest, insertImageRef }) => {
    const grid = data.length > 0 ? data : [[{ value: '', style: {} }, { value: '', style: {} }, { value: '', style: {} }], [{ value: '', style: {} }, { value: '', style: {} }, { value: '', style: {} }]];
    
    // Tracking active cell for styling [row, col]
    const [activeCell, setActiveCell] = useState<{r: number, c: number} | null>(null);
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);

    // Provide the insert function to the parent via ref
    useEffect(() => {
        if (insertImageRef) {
            insertImageRef.current = (url: string) => {
                if (activeCell) {
                    handleCellChange(activeCell.r, activeCell.c, url);
                } else {
                    alert('請先點擊選擇一個表格儲存格');
                }
            };
        }
    }, [activeCell, grid, insertImageRef]);

    const handleCellChange = (r: number, c: number, value: string) => {
        const newGrid = grid.map((row, ri) => ri === r ? row.map((col, ci) => ci === c ? { ...col, value } : col) : row);
        onChange(newGrid);
    };

    const handleStyleChange = (styleKey: keyof React.CSSProperties, value: any) => {
        if (!activeCell) return;
        const { r, c } = activeCell;
        const currentCell = grid[r][c];
        const newStyle = { ...currentCell.style, [styleKey]: value };
        if (!value) delete (newStyle as any)[styleKey];
        const newGrid = grid.map((row, ri) => ri === r ? row.map((col, ci) => ci === c ? { ...col, style: newStyle } : col) : row);
        onChange(newGrid);
        setShowColorPicker(null);
    };

    const getActiveStyle = (key: keyof React.CSSProperties) => activeCell ? grid[activeCell.r][activeCell.c].style?.[key] : undefined;

    const toggleBold = () => handleStyleChange('fontWeight', getActiveStyle('fontWeight') === 'bold' ? 'normal' : 'bold');
    const toggleItalic = () => handleStyleChange('fontStyle', getActiveStyle('fontStyle') === 'italic' ? 'normal' : 'italic');
    const toggleUnderline = () => {
        const current = getActiveStyle('textDecoration') as string;
        handleStyleChange('textDecoration', current?.includes('underline') ? 'none' : 'underline');
    };
    const toggleStrikethrough = () => {
        const current = getActiveStyle('textDecoration') as string;
        handleStyleChange('textDecoration', current?.includes('line-through') ? 'none' : 'line-through');
    };
    
    const clearFormatting = () => {
        if (!activeCell) return;
        const { r, c } = activeCell;
        const newGrid = grid.map((row, ri) => ri === r ? row.map((col, ci) => ci === c ? { ...col, style: {} } : col) : row);
        onChange(newGrid);
    };

    const addRow = () => onChange([...grid, Array(grid[0]?.length || 3).fill({ value: '', style: {} })]);
    const addCol = () => onChange(grid.map(row => [...row, { value: '', style: {} }]));
    const removeRow = (index: number) => { if(grid.length > 1) { onChange(grid.filter((_, i) => i !== index)); setActiveCell(null); } };
    const removeCol = (index: number) => { if(grid[0].length > 1) { onChange(grid.map(row => row.filter((_, i) => i !== index))); setActiveCell(null); } };

    // Fonts & Sizes for Sheet
    const sheetFonts = [
        { label: '預設', value: '' },
        { label: 'Inter', value: "'Inter', sans-serif" },
        { label: 'Roboto', value: "'Roboto', sans-serif" },
        { label: 'Playfair', value: "'Playfair Display', serif" },
        { label: 'Syne', value: "'Syne', sans-serif" },
        { label: 'Dela Gothic', value: "'Dela Gothic One', cursive" },
        { label: 'Noto Sans TC', value: "'Noto Sans TC', sans-serif" }
    ];
    const sheetSizes = ['12px','14px','16px','18px','20px','24px','30px','36px','48px'];

    // --- Read Only View ---
    if (readOnly) {
        if (grid.every(r => r.every(c => !c.value.trim()))) return null;
        return (
            <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 shadow-sm">
                <table className="w-full text-sm text-left text-stone-600 border-collapse">
                    <tbody>
                        {grid.map((row, ri) => (
                            <tr key={ri} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                                {row.map((cell, ci) => (
                                    <td 
                                        key={ci} 
                                        className={`px-6 py-4 border-r border-stone-100 last:border-0 ${ri === 0 && !cell.style?.fontWeight ? 'font-bold bg-stone-50 text-stone-800' : ''}`}
                                        style={cell.style}
                                    >
                                        {isImageUrl(cell.value) ? (
                                            <img src={cell.value} alt="Cell content" className="max-w-[150px] rounded-md shadow-sm border border-stone-100" />
                                        ) : (
                                            cell.value
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // --- Editor Toolbar ---
    const colors = [{ label: '預設', value: '' }, { label: 'Orange', value: '#f97316' }, { label: 'Red', value: '#ef4444' }, { label: 'Green', value: '#10b981' }, { label: 'Blue', value: '#3b82f6' }, { label: 'Gray', value: '#57534e' }, { label: 'Black', value: '#000000' }];
    const bgColors = [{ label: '無', value: '' }, { label: 'White', value: '#ffffff' }, { label: 'Stone', value: '#fafaf9' }, { label: 'Orange', value: '#ffedd5' }, { label: 'Red', value: '#fee2e2' }, { label: 'Green', value: '#d1fae5' }, { label: 'Blue', value: '#dbeafe' }, { label: 'Yellow', value: '#fef3c7' }];

    return (
        <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest shrink-0">附表編輯</h3>
                
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-lg border border-stone-200 shadow-sm">
                     {/* Font Family */}
                     <div className="relative group">
                         <select 
                            className="appearance-none pl-2 pr-6 py-1.5 rounded hover:bg-stone-100 text-xs font-bold text-stone-600 border border-transparent hover:border-stone-200 outline-none w-24 truncate cursor-pointer"
                            value={getActiveStyle('fontFamily') || ''}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                         >
                             {sheetFonts.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                         </select>
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-stone-400">▼</div>
                     </div>

                     {/* Font Size */}
                     <div className="relative group">
                         <select 
                            className="appearance-none pl-2 pr-6 py-1.5 rounded hover:bg-stone-100 text-xs font-bold text-stone-600 border border-transparent hover:border-stone-200 outline-none w-16 cursor-pointer"
                            value={getActiveStyle('fontSize') || '14px'}
                            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                         >
                             {sheetSizes.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-stone-400">▼</div>
                     </div>

                     <div className="w-px h-4 bg-stone-300 mx-1"></div>

                     {/* Text Color */}
                    <div className="relative">
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(showColorPicker === 'text' ? null : 'text'); }}
                            className="p-1.5 rounded hover:bg-stone-100 text-stone-600 font-bold text-xs flex items-center gap-1 relative"
                            title="文字顏色"
                        >
                            <span className="w-4 h-4 rounded-full border border-stone-200 flex items-center justify-center text-[10px]" style={{ background: getActiveStyle('color') || '#000', color: getActiveStyle('color') === '#000000' || !getActiveStyle('color') ? 'white' : 'black' }}>A</span>
                        </button>
                        {showColorPicker === 'text' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl z-20 p-2 grid grid-cols-4 gap-1 w-32">
                                {colors.map(c => (
                                    <button 
                                        key={c.label} 
                                        onMouseDown={(e) => { e.preventDefault(); handleStyleChange('color', c.value); }}
                                        className="w-6 h-6 rounded-full border border-stone-100 hover:scale-110 transition-transform"
                                        style={{ background: c.value || `linear-gradient(to bottom right, #fff, #ccc)` }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bg Color */}
                    <div className="relative">
                        <button 
                             onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(showColorPicker === 'bg' ? null : 'bg'); }}
                            className="p-1.5 rounded hover:bg-stone-100 text-stone-600 font-bold text-xs flex items-center gap-1"
                            title="背景顏色"
                        >
                            <div className="w-4 h-4 rounded border border-stone-200 relative" style={{ background: getActiveStyle('backgroundColor') || '#fff' }}>
                                <svg className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-400 mix-blend-difference" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C21.95 7.44 21.95 3.22 19.35 0.62C16.75 -1.98 12.53 -1.98 9.93 0.62L0 10.55V20H9.45L19.35 10.04ZM2.07 11.21L9.93 3.35C11.53 1.75 14.13 1.75 15.73 3.35L2.07 17.01V11.21ZM2.07 19.84V19.84H2.07V19.84Z" /></svg>
                            </div>
                        </button>
                        {showColorPicker === 'bg' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl z-20 p-2 grid grid-cols-4 gap-1 w-32">
                                {bgColors.map(c => (
                                    <button 
                                        key={c.label} 
                                        onMouseDown={(e) => { e.preventDefault(); handleStyleChange('backgroundColor', c.value); }}
                                        className="w-6 h-6 rounded border border-stone-100 hover:scale-110 transition-transform"
                                        style={{ background: c.value || `linear-gradient(to bottom right, #fff, #ccc)` }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-stone-300 mx-1"></div>

                    {/* Formatting */}
                    <button onMouseDown={(e) => { e.preventDefault(); toggleBold(); }} className={`p-1.5 rounded hover:bg-stone-100 font-serif font-bold text-stone-700 ${getActiveStyle('fontWeight') === 'bold' ? 'bg-stone-200' : ''}`} title="粗體">B</button>
                    <button onMouseDown={(e) => { e.preventDefault(); toggleItalic(); }} className={`p-1.5 rounded hover:bg-stone-100 font-serif italic text-stone-700 ${getActiveStyle('fontStyle') === 'italic' ? 'bg-stone-200' : ''}`} title="斜體">I</button>
                    <button onMouseDown={(e) => { e.preventDefault(); toggleUnderline(); }} className={`p-1.5 rounded hover:bg-stone-100 font-serif underline text-stone-700 ${(getActiveStyle('textDecoration') as string)?.includes('underline') ? 'bg-stone-200' : ''}`} title="底線">U</button>
                    <button onMouseDown={(e) => { e.preventDefault(); toggleStrikethrough(); }} className={`p-1.5 rounded hover:bg-stone-100 font-serif line-through text-stone-700 ${(getActiveStyle('textDecoration') as string)?.includes('line-through') ? 'bg-stone-200' : ''}`} title="刪除線">S</button>

                    <div className="w-px h-4 bg-stone-300 mx-1"></div>

                    {/* Alignment */}
                    <button onMouseDown={(e) => { e.preventDefault(); handleStyleChange('textAlign', 'left'); }} className={`p-1.5 rounded hover:bg-stone-100 ${getActiveStyle('textAlign') === 'left' ? 'bg-stone-200' : ''}`} title="靠左"><svg className="w-3 h-3 text-stone-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"/></svg></button>
                    <button onMouseDown={(e) => { e.preventDefault(); handleStyleChange('textAlign', 'center'); }} className={`p-1.5 rounded hover:bg-stone-100 ${getActiveStyle('textAlign') === 'center' ? 'bg-stone-200' : ''}`} title="置中"><svg className="w-3 h-3 text-stone-600" fill="currentColor" viewBox="0 0 24 24"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg></button>
                    <button onMouseDown={(e) => { e.preventDefault(); handleStyleChange('textAlign', 'right'); }} className={`p-1.5 rounded hover:bg-stone-100 ${getActiveStyle('textAlign') === 'right' ? 'bg-stone-200' : ''}`} title="靠右"><svg className="w-3 h-3 text-stone-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></button>

                    <div className="w-px h-4 bg-stone-300 mx-1"></div>

                    {/* Image */}
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); onImageRequest && onImageRequest(); }}
                        className="p-1.5 rounded hover:bg-stone-100 hover:text-pizza-500 text-stone-600"
                        title="插入圖片 (連結)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    
                    {/* Clear */}
                    <button onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} className="p-1.5 rounded hover:bg-stone-100" title="清除格式">
                         <svg className="w-3 h-3 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>

                    <div className="w-px h-4 bg-stone-300 mx-1"></div>

                    {/* Structure */}
                    <div className="flex gap-1">
                        <button onClick={addRow} className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-[10px] font-bold hover:bg-white text-stone-600">+列</button>
                        <button onClick={addCol} className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-[10px] font-bold hover:bg-white text-stone-600">+行</button>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto p-4 bg-white rounded-xl shadow-inner border border-stone-100">
                <table className="w-full border-collapse">
                    <tbody>
                        {grid.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => (
                                    <td key={`${ri}-${ci}`} className="border border-stone-200 p-0 min-w-[100px] relative group">
                                        <input 
                                            type="text" 
                                            value={cell.value} 
                                            onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                                            onFocus={() => setActiveCell({ r: ri, c: ci })}
                                            style={cell.style}
                                            className={`w-full h-full px-3 py-2 outline-none transition-colors ${ri===0 && !cell.style?.backgroundColor ? 'font-bold bg-stone-50' : 'bg-transparent'} ${activeCell?.r === ri && activeCell?.c === ci ? 'ring-2 ring-pizza-500 ring-inset z-10' : ''}`}
                                        />
                                        {ci === row.length - 1 && grid.length > 1 && (
                                            <button onClick={() => removeRow(ri)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 z-10 hover:scale-110 flex items-center justify-center shadow-md border-2 border-white" title="刪除列">×</button>
                                        )}
                                        {ri === grid.length - 1 && row.length > 1 && (
                                            <button onClick={() => removeCol(ci)} className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 z-10 hover:scale-110 flex items-center justify-center shadow-md border-2 border-white" title="刪除行">×</button>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ... MediaModal and CustomToolbar components remain the same ...
const MediaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string) => void;
}> = ({ isOpen, onClose, onInsert }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setErrorMsg(null);
            setFile(null);
            setUrl('');
            setUploading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleUpload = async () => {
        setErrorMsg(null);
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
             setErrorMsg('檔案過大 (超過 50MB)。\n建議壓縮檔案後再試。');
             return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const { error } = await supabase.storage.from('media').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
            onInsert(publicUrl);
            onClose();
        } catch (error: any) {
             setErrorMsg(error.message?.includes('maximum allowed size') ? '上傳失敗：檔案超過伺服器限制 (50MB)。' : '上傳失敗：' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUrlInsert = () => {
        if (!url) return;
        onInsert(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/50" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-stone-800 mb-4">插入圖片</h3>
                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-pulse">
                        <div className="text-red-500 text-lg">⚠️</div>
                        <p className="text-xs text-red-600 font-bold whitespace-pre-line leading-relaxed pt-0.5">{errorMsg}</p>
                    </div>
                )}
                <div className="flex gap-4 mb-6 border-b border-stone-100">
                    <button onClick={() => { setActiveTab('upload'); setErrorMsg(null); }} className={`pb-2 text-sm font-bold ${activeTab === 'upload' ? 'text-pizza-500 border-b-2 border-pizza-500' : 'text-stone-400'}`}>上傳檔案</button>
                    <button onClick={() => { setActiveTab('url'); setErrorMsg(null); }} className={`pb-2 text-sm font-bold ${activeTab === 'url' ? 'text-pizza-500 border-b-2 border-pizza-500' : 'text-stone-400'}`}>網址連結</button>
                </div>
                {activeTab === 'upload' ? (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors">
                            <input type="file" accept="image/*" onChange={e => { if(e.target.files && e.target.files[0]) { setFile(e.target.files[0]); setErrorMsg(null); } }} className="hidden" id="media-upload" />
                            <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                                <span className="text-2xl mb-2">📷</span>
                                <span className="text-sm font-bold text-stone-600">{file ? file.name : '點擊選擇檔案'}</span>
                            </label>
                        </div>
                        <button onClick={handleUpload} disabled={!file || uploading} className="w-full py-3 bg-pizza-500 hover:bg-pizza-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">{uploading ? '上傳中...' : '確認上傳'}</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input type="text" value={url} onChange={e => { setUrl(e.target.value); setErrorMsg(null); }} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-pizza-500 outline-none text-sm" />
                        <button onClick={handleUrlInsert} disabled={!url} className="w-full py-3 bg-pizza-500 hover:bg-pizza-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">插入連結</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomToolbar = React.memo(({ onImage, id }: { onImage: () => void, id: string }) => (
    <div id={id} className="flex flex-wrap items-center gap-1 sticky top-0 z-20 bg-[#f5f5f4] border-b border-[#e7e5e4] px-2 py-2 rounded-t-2xl">
      <select className="ql-header" defaultValue="" onChange={e => e.persist()} title="標題">
        <option value="1" />
        <option value="2" />
        <option value="" />
      </select>
      <select className="ql-font" defaultValue="inter" title="字體">
        <option value="inter">Inter</option>
        <option value="roboto">Roboto</option>
        <option value="playfair">Playfair</option>
        <option value="syne">Syne</option>
        <option value="dela">Dela Gothic</option>
        <option value="noto">Noto Sans TC</option>
      </select>
      <select className="ql-size" defaultValue="16px" title="大小">
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
        <option value="36px">36px</option>
        <option value="48px">48px</option>
      </select>
      <span className="w-px h-4 bg-stone-300 mx-1" />
      <button className="ql-bold" title="粗體" />
      <button className="ql-italic" title="斜體" />
      <button className="ql-underline" title="底線" />
      <button className="ql-strike" title="刪除線" />
      <button className="ql-blockquote" title="引用" />
      <select className="ql-color" title="文字顏色" />
      <select className="ql-background" title="背景顏色" />
      <span className="w-px h-4 bg-stone-300 mx-1" />
      <button className="ql-list" value="ordered" title="編號列表" />
      <button className="ql-list" value="bullet" title="項目符號" />
      <button className="ql-align" value="" title="靠左對齊" />
      <button className="ql-align" value="center" title="置中對齊" />
      <button className="ql-align" value="right" title="靠右對齊" />
      <span className="w-px h-4 bg-stone-300 mx-1" />
      <button className="ql-link" title="插入連結" />
      <button onClick={onImage} className="hover:text-pizza-500" title="插入圖片">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </button>
      <button className="ql-clean" title="清除格式" />
    </div>
));

const TrainingItemDetailPage: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<TrainingItem | null>(null);
  const [editorHtml, setEditorHtml] = useState('');
  const [sheetData, setSheetData] = useState<SheetCell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; target: 'quill' | 'sheet' }>({ isOpen: false, target: 'quill' });
  
  // Generate unique ID for this editor instance's toolbar to avoid ID conflicts
  const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const quillRef = useRef<ReactQuill>(null);
  const insertSheetImageRef = useRef<((url: string) => void) | undefined>(undefined);

  const modules = useMemo(() => ({
    toolbar: {
      container: `#${toolbarId}`,
    },
    clipboard: {
        matchVisual: false
    }
  }), [toolbarId]);

  useEffect(() => {
    // Ensure Quill formats are registered when entering edit mode
    if (isEditMode) {
        const registered = registerQuill();
        if (!registered) console.warn('Quill registration failed, custom formats may not work');
    }
  }, [isEditMode]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      setLoading(true);
      const { data } = await supabase.from('training_items').select('*').eq('id', itemId).single();
      if (data) {
        setItem({ ...data, workArea: data.work_area, typeTag: data.type_tag, content: data.content || [] });
        
        const blocks = data.content || [];
        setEditorHtml(convertBlocksToHtml(blocks));
        
        const tableBlock = blocks.find((b: SOPBlock) => b.type === 'table');
        if (tableBlock) {
            try {
                const parsed = JSON.parse(tableBlock.content);
                setSheetData(normalizeSheetData(parsed));
            } catch (e) {
                setSheetData([]);
            }
        }
      } else { 
          navigate('/training-items'); 
      }
      setLoading(false);
    };
    fetchItem();
  }, [itemId, navigate]);

  const handleSave = async () => {
    if (!itemId) return;
    setSaving(true);
    
    const linkedHtml = autoLinkHtml(editorHtml);
    
    const blocks: SOPBlock[] = [{ id: crypto.randomUUID(), type: 'richtext', content: linkedHtml }];

    if (sheetData.length > 0 && sheetData.some(row => row.some(cell => cell.value.trim() !== ''))) {
        blocks.push({ id: crypto.randomUUID(), type: 'table', content: JSON.stringify(sheetData) });
    }

    await supabase.from('training_items').update({ content: blocks }).eq('id', itemId);
    
    setEditorHtml(linkedHtml);
    setSaving(false);
    alert('儲存成功');
    setIsEditMode(false);
  };

  const handleMediaInsert = React.useCallback((url: string) => {
      if (mediaModal.target === 'quill') {
          const quill = quillRef.current?.getEditor();
          if (quill) {
              const range = quill.getSelection(true);
              if (range) {
                  quill.insertEmbed(range.index, 'image', url);
              } else {
                  // If no selection, insert at end
                  const len = quill.getLength();
                  quill.insertEmbed(len, 'image', url);
              }
          }
      } else if (mediaModal.target === 'sheet') {
          if (insertSheetImageRef.current) {
              insertSheetImageRef.current(url);
          }
      }
  }, [mediaModal.target]);

  const canManage = ['admin', 'duty'].includes(userRole);

  if (loading || !item) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50/90 backdrop-blur-sm">
        <div className="text-4xl md:text-6xl font-black text-pizza-500 animate-pulse tracking-[0.2em] font-sans drop-shadow-sm select-none">載入中</div>
      </div>
  );

  return (
    <div className="container mx-auto p-6 pb-32 max-w-5xl">
        <MediaModal 
            isOpen={mediaModal.isOpen}
            onClose={() => setMediaModal(prev => ({ ...prev, isOpen: false }))}
            onInsert={handleMediaInsert}
        />

        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-4xl font-bold text-stone-900">{item.name}</h1>
                <div className="flex gap-2 mt-2"><span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold">{item.workArea}</span></div>
            </div>
            {canManage && !isEditMode && (
                <button onClick={() => setIsEditMode(true)} className="texture-grain px-6 py-3 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-pizza-500 hover:scale-105 transition-all">編輯模式</button>
            )}
        </div>

        {isEditMode ? (
            <div className="bg-white rounded-3xl shadow-xl border border-stone-200 animate-fade-in relative p-1 overflow-visible">
                <CustomToolbar 
                    id={toolbarId}
                    onImage={() => setMediaModal({ isOpen: true, target: 'quill' })} 
                />
                <ReactQuill 
                    key={toolbarId} // Force remount if ID changes (rare)
                    ref={quillRef}
                    theme="snow"
                    value={editorHtml}
                    onChange={setEditorHtml}
                    modules={modules}
                    className="h-[50vh]"
                />
                <div className="h-12 bg-white"></div>
                
                {/* Sheet Editor Section */}
                <div className="p-4 border-t border-stone-100 bg-white">
                    <SheetEditor 
                        data={sheetData} 
                        onChange={setSheetData} 
                        onImageRequest={() => setMediaModal({ isOpen: true, target: 'sheet' })}
                        insertImageRef={insertSheetImageRef}
                    />
                </div>
                <div className="h-24"></div>
            </div>
        ) : (
            <div className="glass-panel p-12 rounded-3xl min-h-[60vh] bg-white shadow-xl">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: editorHtml }} />
                
                {/* Sheet View Section */}
                {sheetData.length > 0 && sheetData.some(r=>r.some(c=>c.value.trim())) && (
                    <div className="mt-12 border-t border-stone-100 pt-8">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">相關表格</h3>
                        <SheetEditor data={sheetData} onChange={()=>{}} readOnly />
                    </div>
                )}
                
                {(!editorHtml || editorHtml === '<p><br></p>') && (!sheetData.length || !sheetData.some(r=>r.some(c=>c.value.trim()))) && <div className="text-center text-stone-300 py-20">尚無內容</div>}
            </div>
        )}

        {isEditMode && (
            <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
                <div className="flex gap-3">
                    <button onClick={() => { setIsEditMode(false); setEditorHtml(convertBlocksToHtml(item.content || [])); }} className="px-6 py-4 bg-white text-stone-500 border border-stone-200 rounded-full shadow-lg font-bold text-sm uppercase tracking-widest hover:bg-stone-100">取消</button>
                    <button onClick={handleSave} disabled={saving} className="texture-grain flex items-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-full shadow-2xl hover:bg-pizza-500 font-bold text-sm uppercase tracking-widest transition-all">{saving ? '儲存中...' : '儲存變更'}</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default TrainingItemDetailPage;
