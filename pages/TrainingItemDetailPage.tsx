
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { type TrainingItem, type SOPBlock, type BlockType, type UserRole } from '../types';
import Tooltip from '../components/Tooltip';
import { TrashIcon } from '../components/icons/TrashIcon';

// --- Icons ---
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const ChevronUpIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
const ChevronDownIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const ImageIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const VideoIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TypeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TableIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

interface TrainingItemDetailPageProps {
  userRole: UserRole;
}

interface ConfirmState {
    message: string;
    onConfirm: () => void;
}

// --- Block Renderer Component ---
const BlockRenderer: React.FC<{
  block: SOPBlock;
  isEditing: boolean;
  onUpdate: (id: string, content: string) => void;
  onUpdateProps: (id: string, props: any) => void;
  onConfirmAction: (message: string, action: () => void) => void;
}> = ({ block, isEditing, onUpdate, onUpdateProps, onConfirmAction }) => {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content]);

  const commonClasses = "w-full bg-transparent outline-none transition-all resize-none";

  switch (block.type) {
    case 'heading-1':
      return isEditing ? (
        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-4xl font-playfair font-bold text-stone-900 placeholder-stone-300 mt-6 mb-4`} placeholder="大標題..." rows={1} />
      ) : <h1 className="text-4xl font-playfair font-bold text-stone-900 mt-6 mb-4">{block.content}</h1>;
    
    case 'heading-2':
      return isEditing ? (
        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-2xl font-playfair font-bold text-stone-800 placeholder-stone-300 mt-4 mb-2 border-b border-stone-200 pb-2`} placeholder="中標題..." rows={1} />
      ) : <h2 className="text-2xl font-playfair font-bold text-stone-800 mt-4 mb-2 border-b border-stone-200 pb-2">{block.content}</h2>;

    case 'heading-3':
      return isEditing ? (
        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-xl font-bold text-stone-700 placeholder-stone-300 mt-3 mb-1`} placeholder="小標題..." rows={1} />
      ) : <h3 className="text-xl font-bold text-stone-700 mt-3 mb-1">{block.content}</h3>;

    case 'bullet-list':
      return (
        <div className="flex items-start gap-2 my-1">
          <span className="text-stone-400 text-xl leading-relaxed">•</span>
          {isEditing ? (
            <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-stone-700 leading-relaxed`} placeholder="清單項目..." rows={1} />
          ) : <p className="text-stone-700 leading-relaxed">{block.content}</p>}
        </div>
      );

    case 'number-list':
        return (
          <div className="flex items-start gap-2 my-1">
            <span className="text-stone-400 font-mono mt-0.5">1.</span>
            {isEditing ? (
              <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-stone-700 leading-relaxed`} placeholder="編號清單..." rows={1} />
            ) : <p className="text-stone-700 leading-relaxed">{block.content}</p>}
          </div>
        );

    case 'callout':
        return (
            <div className={`p-4 rounded-xl border my-4 flex gap-3 ${block.props?.color === 'red' ? 'bg-red-50 border-red-100 text-red-800' : block.props?.color === 'blue' ? 'bg-sky-50 border-sky-100 text-sky-800' : block.props?.color === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                <div className="mt-0.5">💡</div>
                {isEditing ? (
                    <div className="flex-grow">
                        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} bg-transparent font-medium`} placeholder="重點提示..." rows={1} />
                        <div className="flex gap-2 mt-2">
                            {['amber', 'red', 'blue', 'green'].map(c => (
                                <button key={c} type="button" onClick={() => onUpdateProps(block.id, { color: c })} className={`w-4 h-4 rounded-full ${c === 'amber' ? 'bg-amber-400' : c === 'red' ? 'bg-red-400' : c === 'blue' ? 'bg-sky-400' : 'bg-emerald-400'}`}></button>
                            ))}
                        </div>
                    </div>
                ) : <p className="font-medium whitespace-pre-wrap">{block.content}</p>}
            </div>
        );

    case 'image':
        return (
            <div className="my-6">
                {block.content ? (
                    <div className="relative group">
                        <img src={block.content} alt="SOP Img" className="rounded-xl shadow-sm max-w-full h-auto max-h-[500px] object-contain mx-auto border border-stone-100" />
                        {isEditing && (
                            <input 
                                type="text" 
                                value={block.content} 
                                onChange={e => onUpdate(block.id, e.target.value)} 
                                className="absolute bottom-2 left-2 right-2 glass-input text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                                placeholder="圖片網址..."
                            />
                        )}
                    </div>
                ) : (
                    isEditing ? (
                        <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center bg-stone-50">
                            <p className="text-stone-400 text-sm mb-2">請輸入圖片網址</p>
                            <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="https://..." />
                        </div>
                    ) : null
                )}
            </div>
        );

    case 'video':
        // Simple Youtube Embed parser
        const getEmbedUrl = (url: string) => {
            if (!url) return '';
            if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
            if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
            return url; 
        };
        
        return (
            <div className="my-6 aspect-video bg-stone-100 rounded-xl overflow-hidden relative group">
                {block.content ? (
                    <>
                        <iframe src={getEmbedUrl(block.content)} title="Video" className="w-full h-full" allowFullScreen frameBorder="0"></iframe>
                        {isEditing && (
                             <input 
                                type="text" 
                                value={block.content} 
                                onChange={e => onUpdate(block.id, e.target.value)} 
                                className="absolute bottom-2 left-2 right-2 glass-input text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                                placeholder="影片網址..."
                            />
                        )}
                    </>
                ) : (
                    isEditing ? (
                        <div className="flex items-center justify-center h-full border-2 border-dashed border-stone-300 rounded-xl p-4">
                             <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="glass-input w-3/4 px-3 py-2 text-sm" placeholder="輸入 YouTube 影片網址..." />
                        </div>
                    ) : null
                )}
            </div>
        );
    
    case 'table':
        let tableData: string[][] = [];
        try {
            tableData = JSON.parse(block.content);
            if (!Array.isArray(tableData)) tableData = [['標題 1', '標題 2'], ['內容 1', '內容 2']];
        } catch {
            tableData = [['標題 1', '標題 2'], ['內容 1', '內容 2']];
        }

        const updateTableData = (newData: string[][]) => {
             onUpdate(block.id, JSON.stringify(newData));
        };

        const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
            const newData = [...tableData];
            newData[rowIndex] = [...newData[rowIndex]];
            newData[rowIndex][colIndex] = value;
            updateTableData(newData);
        };

        const addRow = () => {
            const colCount = tableData[0]?.length || 1;
            const newRow = new Array(colCount).fill('');
            updateTableData([...tableData, newRow]);
        };

        const addColumn = () => {
            const newData = tableData.map(row => [...row, '']);
            updateTableData(newData);
        };

        const deleteRow = (rowIndex: number, e: React.MouseEvent) => {
             e.preventDefault();
             e.stopPropagation();
             if (tableData.length <= 1) return;
             
             onConfirmAction('確定要刪除此列嗎？', () => {
                 const newData = tableData.filter((_, i) => i !== rowIndex);
                 updateTableData(newData);
             });
        };

        const deleteColumn = (colIndex: number, e: React.MouseEvent) => {
             e.preventDefault();
             e.stopPropagation();
             if (tableData[0].length <= 1) return;
             
             onConfirmAction('確定要刪除此欄嗎？', () => {
                 const newData = tableData.map(row => row.filter((_, i) => i !== colIndex));
                 updateTableData(newData);
             });
        };

        return (
            <div className="my-6 w-full overflow-x-auto pb-6 pl-4 pt-4 pr-2 relative z-10">
                <div className="inline-block min-w-full align-middle">
                     <table className="min-w-full border-collapse border border-stone-200 shadow-sm bg-white rounded-lg">
                         <thead>
                             <tr>
                                 {isEditing && <th className="p-2 bg-stone-50 w-10 border border-stone-200"></th>}
                                 {tableData[0].map((_, colIndex) => (
                                     <th key={colIndex} className="relative p-2 bg-stone-50 border border-stone-200 min-w-[120px] group/col">
                                         {isEditing && (
                                             <button 
                                                type="button"
                                                onClick={(e) => deleteColumn(colIndex, e)} 
                                                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-500 border border-stone-200 rounded-full p-1 opacity-0 group-hover/col:opacity-100 transition-opacity hover:bg-red-50 z-[100] shadow-sm cursor-pointer"
                                                title="刪除此欄"
                                             >
                                                 <svg className="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                             </button>
                                         )}
                                     </th>
                                 ))}
                                 {isEditing && (
                                     <th className="p-2 bg-stone-50 border border-stone-200 w-10 align-middle text-center">
                                         <button type="button" onClick={addColumn} className="text-pizza-500 hover:text-pizza-600 bg-white border border-pizza-200 hover:bg-pizza-50 rounded-full p-1 shadow-sm transition-all" title="新增欄">
                                             <PlusIcon />
                                         </button>
                                     </th>
                                 )}
                             </tr>
                         </thead>
                         <tbody className="bg-white">
                             {tableData.map((row, rowIndex) => (
                                 <tr key={rowIndex}>
                                     {isEditing && (
                                         <td className="p-2 bg-stone-50 border border-stone-200 text-center group/row relative w-10">
                                            <button 
                                                type="button"
                                                onClick={(e) => deleteRow(rowIndex, e)} 
                                                className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white text-red-500 border border-stone-200 rounded-full p-1 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-red-50 z-[100] shadow-sm cursor-pointer"
                                                title="刪除此列"
                                            >
                                                <svg className="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                         </td>
                                     )}
                                     {row.map((cell, colIndex) => (
                                         <td key={colIndex} className="border border-stone-200 p-0 relative">
                                             {isEditing ? (
                                                 <textarea
                                                     value={cell} 
                                                     onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                     className="w-full h-full min-h-[40px] p-3 bg-transparent outline-none focus:bg-pizza-50/10 transition-colors text-sm text-stone-700 resize-none block"
                                                     placeholder="..."
                                                     rows={1}
                                                 />
                                             ) : (
                                                 <div className="p-3 text-sm text-stone-700 whitespace-pre-wrap break-words">{cell}</div>
                                             )}
                                         </td>
                                     ))}
                                     {isEditing && <td className="bg-stone-50 border border-stone-200"></td>}
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                    {isEditing && (
                         <div className="mt-2">
                             <button type="button" onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:border-pizza-300 hover:text-pizza-600 text-stone-500 rounded-lg text-xs font-bold uppercase transition-all shadow-sm">
                                 <PlusIcon /> 新增列
                             </button>
                         </div>
                    )}
                </div>
            </div>
        );

    case 'divider':
        return <hr className="my-8 border-t-2 border-stone-100" />;

    default: // 'text'
      return isEditing ? (
        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-stone-600 leading-relaxed min-h-[1.5em]`} placeholder="輸入內容..." rows={1} />
      ) : <p className="text-stone-600 leading-relaxed whitespace-pre-wrap min-h-[1.5em]">{block.content || <br/>}</p>;
  }
};


const TrainingItemDetailPage: React.FC<TrainingItemDetailPageProps> = ({ userRole }) => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<TrainingItem | null>(null);
  const [blocks, setBlocks] = useState<SOPBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const canEdit = ['admin', 'duty'].includes(userRole);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('training_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        console.error('Error fetching item:', error);
        navigate('/training-items');
      } else if (data) {
        const mappedItem: TrainingItem = {
            id: data.id,
            name: data.name,
            workArea: data.work_area,
            typeTag: data.type_tag,
            chapter: data.chapter,
            content: data.content || []
        };
        setItem(mappedItem);
        setBlocks(mappedItem.content || []);
      }
      setLoading(false);
    };
    fetchItem();
  }, [itemId, navigate]);

  const handleSave = async () => {
    if (!itemId) return;
    setSaving(true);
    const { error } = await supabase
        .from('training_items')
        .update({ content: blocks })
        .eq('id', itemId);
    
    if (!error) {
        setLastSaved(new Date());
    } else {
        alert('儲存失敗');
    }
    setSaving(false);
  };

  // --- Block Operations ---
  const addBlock = (type: BlockType) => {
    const newBlock: SOPBlock = {
        id: crypto.randomUUID(),
        type,
        content: type === 'table' ? JSON.stringify([['標題 1', '標題 2'], ['內容 1', '內容 2']]) : '',
        props: type === 'callout' ? { color: 'amber' } : {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const updateBlockProps = (id: string, props: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b));
  };

  const deleteBlock = (id: string, e?: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setConfirmState({
        message: '確定要刪除此區塊嗎？',
        onConfirm: () => {
             setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== id));
             setConfirmState(null);
        }
    });
  };

  const handleConfirmAction = (message: string, action: () => void) => {
      setConfirmState({
          message,
          onConfirm: () => {
              action();
              setConfirmState(null);
          }
      });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
        [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    setBlocks(newBlocks);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-pizza-500 font-bold">載入中...</div>;
  if (!item) return null;

  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-12 pb-32 max-w-4xl relative">
        {/* Custom Confirmation Modal */}
        {confirmState && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-stone-100 transform transition-all scale-100 animate-fade-in">
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <TrashIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900">確認刪除</h3>
                        <p className="text-sm text-stone-500 mt-2">{confirmState.message}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setConfirmState(null)}
                            className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-sm transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            type="button"
                            onClick={confirmState.onConfirm}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
                        >
                            確認刪除
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header Area */}
        <div className="mb-10">
            <Link to="/training-items" className="text-xs font-bold text-stone-400 hover:text-pizza-500 uppercase tracking-widest mb-4 block">← 返回任務列表</Link>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-stone-900 mb-4">{item.name}</h1>
            <div className="flex gap-3">
                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.workArea}</span>
                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.typeTag}</span>
                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.chapter}</span>
            </div>
        </div>

        {/* Editor Canvas */}
        <div className="glass-panel p-8 md:p-12 rounded-3xl min-h-[60vh] bg-white shadow-xl border border-white relative z-0">
            {blocks.length === 0 && canEdit && (
                <div className="text-center py-20 text-stone-300 font-serif border-2 border-dashed border-stone-100 rounded-2xl mb-8">
                    點擊下方按鈕開始建立 SOP 內容
                </div>
            )}
            
            <div className="space-y-2">
                {blocks.map((block, index) => (
                    <div key={block.id} className="group relative pl-2 pr-2 rounded-lg hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                        {/* Action Buttons (Only visible on hover for Admins) */}
                        {canEdit && (
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md border border-stone-100 rounded-md p-1 z-[1000]">
                                <Tooltip text="上移">
                                    <button type="button" onClick={() => moveBlock(index, 'up')} className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded"><ChevronUpIcon /></button>
                                </Tooltip>
                                <Tooltip text="下移">
                                    <button type="button" onClick={() => moveBlock(index, 'down')} className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded"><ChevronDownIcon /></button>
                                </Tooltip>
                                <Tooltip text="刪除">
                                    <button type="button" onClick={(e) => deleteBlock(block.id, e)} className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4" /></button>
                                </Tooltip>
                            </div>
                        )}
                        
                        <BlockRenderer 
                            block={block} 
                            isEditing={canEdit} 
                            onUpdate={updateBlock} 
                            onUpdateProps={updateBlockProps}
                            onConfirmAction={handleConfirmAction}
                        />
                    </div>
                ))}
            </div>

            {/* Add Block Menu (Bottom) */}
            {canEdit && (
                <div className="mt-12 pt-8 border-t border-stone-100">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 text-center">新增區塊</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Tooltip text="一般文字">
                            <button type="button" onClick={() => addBlock('text')} className="p-3 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><TypeIcon /></button>
                        </Tooltip>
                        <Tooltip text="大標題">
                            <button type="button" onClick={() => addBlock('heading-1')} className="px-4 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-playfair font-bold text-lg text-stone-600">H1</button>
                        </Tooltip>
                        <Tooltip text="中標題">
                            <button type="button" onClick={() => addBlock('heading-2')} className="px-4 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-playfair font-bold text-base text-stone-600">H2</button>
                        </Tooltip>
                        <Tooltip text="圖片">
                            <button type="button" onClick={() => addBlock('image')} className="p-3 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><ImageIcon /></button>
                        </Tooltip>
                        <Tooltip text="影片">
                            <button type="button" onClick={() => addBlock('video')} className="p-3 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><VideoIcon /></button>
                        </Tooltip>
                        <Tooltip text="表格">
                            <button type="button" onClick={() => addBlock('table')} className="p-3 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><TableIcon /></button>
                        </Tooltip>
                        <Tooltip text="提示框">
                            <button type="button" onClick={() => addBlock('callout')} className="px-4 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-sm text-stone-600">💡</button>
                        </Tooltip>
                        <Tooltip text="清單">
                            <button type="button" onClick={() => addBlock('bullet-list')} className="px-4 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-sm text-stone-600">• List</button>
                        </Tooltip>
                        <Tooltip text="分隔線">
                            <button type="button" onClick={() => addBlock('divider')} className="px-4 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-stone-400">—</button>
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>

        {/* Floating Save Button */}
        {canEdit && (
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
                {lastSaved && <span className="text-[10px] font-bold text-stone-400 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">已儲存: {lastSaved.toLocaleTimeString()}</span>}
                <button 
                    type="button"
                    onClick={handleSave} 
                    disabled={saving}
                    className="texture-grain flex items-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-full shadow-2xl hover:bg-pizza-500 hover:scale-105 transition-all font-bold text-sm uppercase tracking-widest disabled:opacity-70"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SaveIcon />}
                    {saving ? '儲存中...' : '儲存變更'}
                </button>
            </div>
        )}
    </div>
  );
};

export default TrainingItemDetailPage;
