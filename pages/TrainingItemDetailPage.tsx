
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { type TrainingItem, type SOPBlock, type BlockType, type UserRole } from '../types';
import Tooltip from '../components/Tooltip';
import { TrashIcon } from '../components/icons/TrashIcon';

// --- Icons ---
interface IconProps extends React.SVGProps<SVGSVGElement> {}

const PlusIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const ChevronUpIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
const ChevronDownIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const ImageIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const VideoIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TypeIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const SaveIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TableIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const DocumentIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ToggleIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const LinkIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const EyeIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeSlashIcon: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;

interface TrainingItemDetailPageProps {
  userRole: UserRole;
}

interface ConfirmState {
    message: string;
    onConfirm: () => void;
}

// --- Link Input Modal ---
const LinkInputModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (text: string, url: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setText('');
            setUrl('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                <h3 className="text-lg font-bold text-stone-800 mb-4">插入超連結</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">連結文字</label>
                        <input 
                            type="text" 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            className="glass-input w-full px-3 py-2 rounded-lg" 
                            placeholder="例如：點擊這裡"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">網址 (URL)</label>
                        <input 
                            type="text" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            className="glass-input w-full px-3 py-2 rounded-lg" 
                            placeholder="https://..."
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2 bg-stone-100 rounded-lg text-xs font-bold text-stone-600">取消</button>
                    <button 
                        onClick={() => { if (text && url) { onConfirm(text, url); onClose(); } }}
                        className="flex-1 py-2 bg-pizza-500 text-white rounded-lg text-xs font-bold shadow-md"
                        disabled={!text || !url}
                    >
                        插入連結
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Helper: Robust Text Parser for Links ---
const parseRawUrls = (text: string) => {
    // Regex capturing group used to keep separators in split result
    const urlRegex = /((?:https?:\/\/|www\.)[^\s\u4e00-\u9fa5]+)/gi;
    
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(/^(https?:\/\/|www\.)/i)) {
            let href = part;
            if (part.toLowerCase().startsWith('www.')) {
                href = 'https://' + part;
            }
            
            // Strip common trailing punctuation
            const match = href.match(/[.,;!?)]+$/);
            let suffix = '';
            if (match) {
                suffix = match[0];
                href = href.substring(0, href.length - suffix.length);
                part = part.substring(0, part.length - suffix.length);
            }

            return (
                <React.Fragment key={`link-frag-${i}`}>
                    <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-pizza-500 hover:text-pizza-600 hover:underline font-medium break-all cursor-pointer relative z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                    {suffix}
                </React.Fragment>
            );
        }
        return part;
    });
};

const parseText = (text: string) => {
    if (!text) return '';

    // Regex to match Markdown links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    let match;
    while ((match = mdLinkRegex.exec(text)) !== null) {
        // Process text before markdown link for raw URLs
        if (match.index > lastIndex) {
            const subText = text.substring(lastIndex, match.index);
            elements.push(...parseRawUrls(subText));
        }

        // Push Markdown link
        elements.push(
            <a 
                key={`md-${match.index}`} 
                href={match[2]} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-pizza-500 hover:text-pizza-600 hover:underline font-bold mx-1 cursor-pointer relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {match[1]}
            </a>
        );

        lastIndex = mdLinkRegex.lastIndex;
    }

    // Process remaining text for raw URLs
    if (lastIndex < text.length) {
        elements.push(...parseRawUrls(text.substring(lastIndex)));
    }

    return elements;
};

// --- Block Renderer Component ---
const BlockRenderer: React.FC<{
  block: SOPBlock;
  isEditing: boolean;
  onUpdate: (id: string, content: string) => void;
  onUpdateProps: (id: string, props: any) => void;
  onConfirmAction: (message: string, action: () => void) => void;
  indexContext?: number; // For numbered lists
}> = ({ block, isEditing, onUpdate, onUpdateProps, onConfirmAction, indexContext }) => {
  
  const [uploading, setUploading] = useState(false);

  const commonClasses = "w-full bg-transparent outline-none transition-all resize-none border-none p-0 m-0 focus:ring-0 overflow-hidden";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);

      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(filePath);

          onUpdate(block.id, publicUrl);
      } catch (error: any) {
          alert('上傳失敗：' + error.message);
      } finally {
          setUploading(false);
      }
  };

  switch (block.type) {
    case 'heading-1':
      return isEditing ? (
        <textarea 
            value={block.content} 
            onChange={e => onUpdate(block.id, e.target.value)} 
            className={`${commonClasses} text-4xl font-playfair font-bold text-stone-900 placeholder-stone-300 mt-6 mb-4`} 
            placeholder="大標題..." 
            rows={Math.max(1, block.content.split('\n').length)}
        />
      ) : <h1 className="text-4xl font-playfair font-bold text-stone-900 mt-6 mb-4">{block.content}</h1>;
    
    case 'heading-2':
      return isEditing ? (
        <textarea 
            value={block.content} 
            onChange={e => onUpdate(block.id, e.target.value)} 
            className={`${commonClasses} text-2xl font-playfair font-bold text-stone-800 placeholder-stone-300 mt-4 mb-2 border-b border-stone-200 pb-2`} 
            placeholder="中標題..." 
            rows={Math.max(1, block.content.split('\n').length)}
        />
      ) : <h2 className="text-2xl font-playfair font-bold text-stone-800 mt-4 mb-2 border-b border-stone-200 pb-2">{block.content}</h2>;

    case 'heading-3':
      return isEditing ? (
        <textarea 
            value={block.content} 
            onChange={e => onUpdate(block.id, e.target.value)} 
            className={`${commonClasses} text-xl font-bold text-stone-700 placeholder-stone-300 mt-3 mb-1`} 
            placeholder="小標題..." 
            rows={Math.max(1, block.content.split('\n').length)}
        />
      ) : <h3 className="text-xl font-bold text-stone-700 mt-3 mb-1">{block.content}</h3>;

    case 'bullet-list':
      return (
        <div className="flex items-start gap-2 my-1">
          <span className="text-stone-400 text-xl leading-relaxed">•</span>
          {isEditing ? (
            <textarea 
                value={block.content} 
                onChange={e => onUpdate(block.id, e.target.value)} 
                className={`${commonClasses} text-stone-700 leading-relaxed`} 
                placeholder="清單項目..." 
                rows={Math.max(1, block.content.split('\n').length)}
            />
          ) : <p className="text-stone-700 leading-relaxed">{parseText(block.content)}</p>}
        </div>
      );

    case 'number-list':
        return (
          <div className="flex items-start gap-2 my-1">
            <span className="text-stone-400 font-mono mt-0.5 font-bold">{indexContext}.</span>
            {isEditing ? (
              <textarea 
                value={block.content} 
                onChange={e => onUpdate(block.id, e.target.value)} 
                className={`${commonClasses} text-stone-700 leading-relaxed`} 
                placeholder="編號清單..." 
                rows={Math.max(1, block.content.split('\n').length)}
              />
            ) : <p className="text-stone-700 leading-relaxed">{parseText(block.content)}</p>}
          </div>
        );

    case 'callout':
        return (
            <div className={`p-4 rounded-xl border my-4 flex gap-3 ${block.props?.color === 'red' ? 'bg-red-50 border-red-100 text-red-800' : block.props?.color === 'blue' ? 'bg-sky-50 border-sky-100 text-sky-800' : block.props?.color === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                <div className="mt-0.5">💡</div>
                {isEditing ? (
                    <div className="flex-grow">
                        <textarea 
                            value={block.content} 
                            onChange={e => onUpdate(block.id, e.target.value)} 
                            className={`${commonClasses} bg-transparent font-medium`} 
                            placeholder="重點提示..." 
                            rows={Math.max(1, block.content.split('\n').length)}
                        />
                        <div className="flex gap-2 mt-2">
                            {['amber', 'red', 'blue', 'green'].map(c => (
                                <button key={c} type="button" onClick={() => onUpdateProps(block.id, { color: c })} className={`w-4 h-4 rounded-full ${c === 'amber' ? 'bg-amber-400' : c === 'red' ? 'bg-red-400' : c === 'blue' ? 'bg-sky-400' : 'bg-emerald-400'}`}></button>
                            ))}
                        </div>
                    </div>
                ) : <p className="font-medium whitespace-pre-wrap">{parseText(block.content)}</p>}
            </div>
        );

    case 'toggle':
        return (
            <div className="my-4 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {isEditing ? (
                    <div className="p-4 bg-stone-50">
                        <input 
                            type="text" 
                            value={block.content} 
                            onChange={e => onUpdate(block.id, e.target.value)} 
                            className="w-full bg-transparent font-bold text-stone-700 placeholder-stone-400 outline-none mb-2" 
                            placeholder="折疊標題 (例如：點擊查看更多)..."
                        />
                        <div className="h-px bg-stone-200 mb-2"></div>
                        <textarea 
                            value={block.props?.details || ''} 
                            onChange={e => onUpdateProps(block.id, { details: e.target.value })} 
                            className="w-full bg-transparent text-stone-600 text-sm leading-relaxed outline-none resize-none" 
                            placeholder="隱藏的內容..."
                            rows={Math.max(1, (block.props?.details || '').split('\n').length)}
                        />
                    </div>
                ) : (
                    <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-stone-700 hover:bg-stone-50 transition-colors select-none list-none">
                            <span>{block.content || '點擊展開'}</span>
                            <svg className="w-5 h-5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </summary>
                        <div className="p-4 pt-0 mt-4 text-stone-600 text-sm leading-relaxed border-t border-stone-100">
                            {parseText(block.props?.details || '')}
                        </div>
                    </details>
                )}
            </div>
        );

    case 'image':
        return (
            <div className="my-6">
                {block.content ? (
                    <div className="relative group">
                        <img src={block.content} alt="SOP Img" className="rounded-xl shadow-sm max-w-full h-auto max-h-[500px] object-contain mx-auto border border-stone-100" />
                        {isEditing && (
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <input 
                                    type="text" 
                                    value={block.content} 
                                    onChange={e => onUpdate(block.id, e.target.value)} 
                                    className="glass-input text-xs px-2 py-1 flex-grow" 
                                    placeholder="圖片網址..."
                                />
                                <button onClick={() => onUpdate(block.id, '')} className="bg-white p-1 rounded text-red-500 hover:bg-red-50 shadow-sm"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        )}
                    </div>
                ) : (
                    isEditing ? (
                        <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center bg-stone-50 flex flex-col items-center">
                            {uploading ? <div className="text-pizza-500 font-bold animate-pulse">上傳中...</div> : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-stone-400 mb-2"/>
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 text-xs font-bold text-stone-600 mb-2 shadow-sm">
                                        上傳圖片
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                                    </label>
                                    <span className="text-xs text-stone-400 mb-2">- 或 -</span>
                                    <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="glass-input w-3/4 px-3 py-2 text-sm text-center" placeholder="貼上圖片網址..." />
                                </>
                            )}
                        </div>
                    ) : null
                )}
            </div>
        );

    case 'video':
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
                        {block.content.includes('supabase') ? (
                             <video src={block.content} controls className="w-full h-full rounded-xl"></video>
                        ) : (
                             <iframe src={getEmbedUrl(block.content)} title="Video" className="w-full h-full" allowFullScreen frameBorder="0"></iframe>
                        )}
                        {isEditing && (
                             <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <input 
                                    type="text" 
                                    value={block.content} 
                                    onChange={e => onUpdate(block.id, e.target.value)} 
                                    className="glass-input text-xs px-2 py-1 flex-grow" 
                                    placeholder="影片網址..."
                                />
                                <button onClick={() => onUpdate(block.id, '')} className="bg-white p-1 rounded text-red-500 hover:bg-red-50 shadow-sm"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        )}
                    </>
                ) : (
                    isEditing ? (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-stone-300 rounded-xl p-4">
                             {uploading ? <div className="text-pizza-500 font-bold animate-pulse">上傳中...</div> : (
                                <>
                                    <VideoIcon className="w-8 h-8 text-stone-400 mb-2"/>
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 text-xs font-bold text-stone-600 mb-2 shadow-sm">
                                        上傳影片
                                        <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
                                    </label>
                                    <span className="text-xs text-stone-400 mb-2">- 或 -</span>
                                    <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="glass-input w-3/4 px-3 py-2 text-sm text-center" placeholder="貼上 YouTube 網址..." />
                                </>
                             )}
                        </div>
                    ) : null
                )}
            </div>
        );
    
    case 'pdf':
        return (
            <div className="my-6 w-full bg-stone-50 rounded-xl overflow-hidden border border-stone-200">
                {block.content ? (
                    <div className="w-full h-[600px]">
                        <object data={block.content} type="application/pdf" className="w-full h-full">
                            <div className="flex flex-col items-center justify-center h-full text-stone-500">
                                <p className="mb-2">瀏覽器無法直接預覽此 PDF</p>
                                <a href={block.content} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-pizza-500 text-white rounded-lg text-sm font-bold">下載檢視</a>
                            </div>
                        </object>
                    </div>
                ) : (
                    isEditing ? (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-300 rounded-xl m-4 bg-white">
                            {uploading ? (
                                <div className="text-pizza-500 font-bold animate-pulse">上傳中...</div>
                            ) : (
                                <>
                                    <DocumentIcon />
                                    <label className="mt-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold cursor-pointer text-stone-600 transition-colors">
                                        上傳 PDF 檔案
                                        <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} className="hidden" />
                                    </label>
                                    <span className="text-[10px] text-stone-400 mt-2">最大 5MB</span>
                                </>
                            )}
                        </div>
                    ) : null
                )}
                {isEditing && block.content && (
                    <div className="p-2 bg-white border-t border-stone-200 flex justify-end">
                        <button onClick={() => onUpdate(block.id, '')} className="text-red-500 text-xs font-bold px-3 py-1 hover:bg-red-50 rounded">移除 PDF</button>
                    </div>
                )}
            </div>
        );

    case 'divider':
        return <hr className="my-8 border-t-2 border-stone-100" />;
    
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
            <div className="my-6 w-full overflow-x-auto pb-12 pl-4 pt-8 pr-2 relative z-10 custom-scrollbar">
                <div className="inline-block min-w-full align-middle">
                     <table className="min-w-full border-collapse border border-stone-200 shadow-sm bg-white rounded-lg table-fixed">
                         <thead>
                             <tr>
                                 {isEditing && <th className="p-2 bg-stone-50 w-12 border border-stone-200"></th>}
                                 {tableData[0].map((_, colIndex) => (
                                     <th key={colIndex} className="relative p-2 bg-stone-50 border border-stone-200 min-w-[120px] group/col">
                                         {isEditing && (
                                             <div className="absolute -top-8 left-0 right-0 flex justify-center opacity-0 group-hover/col:opacity-100 transition-opacity z-20">
                                                 <button 
                                                    type="button"
                                                    onClick={(e) => deleteColumn(colIndex, e)} 
                                                    className="bg-white text-red-500 border border-stone-200 rounded-full p-1.5 hover:bg-red-50 shadow-md cursor-pointer"
                                                    title="刪除此欄"
                                                 >
                                                     <svg className="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                 </button>
                                             </div>
                                         )}
                                     </th>
                                 ))}
                                 {isEditing && (
                                     <th className="p-2 bg-stone-50 border border-stone-200 w-16 align-middle text-center bg-pizza-50/50 hover:bg-pizza-50 transition-colors cursor-pointer" onClick={addColumn} title="新增欄">
                                         <div className="flex flex-col items-center justify-center h-full text-pizza-500">
                                             <PlusIcon className="w-6 h-6"/>
                                         </div>
                                     </th>
                                 )}
                             </tr>
                         </thead>
                         <tbody className="bg-white">
                             {tableData.map((row, rowIndex) => (
                                 <tr key={rowIndex}>
                                     {isEditing && (
                                         <td className="p-2 bg-stone-50 border border-stone-200 text-center group/row relative w-12">
                                            <button 
                                                type="button"
                                                onClick={(e) => deleteRow(rowIndex, e)} 
                                                className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white text-red-500 border border-stone-200 rounded-full p-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-red-50 z-20 shadow-md cursor-pointer"
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
                                                     className="w-full h-full min-h-[48px] p-3 bg-transparent outline-none focus:bg-pizza-50/20 focus:ring-2 focus:ring-pizza-500/20 transition-all text-sm text-stone-700 resize-none block"
                                                     placeholder="..."
                                                     rows={Math.max(1, cell.split('\n').length)}
                                                 />
                                             ) : (
                                                 <div className="p-3 text-sm text-stone-700 whitespace-pre-wrap break-words">{parseText(cell)}</div>
                                             )}
                                         </td>
                                     ))}
                                     {isEditing && <td className="bg-stone-50 border border-stone-200"></td>}
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                    {isEditing && (
                         <div className="flex justify-center mt-2">
                             <button 
                                type="button" 
                                onClick={addRow} 
                                className="flex items-center justify-center w-8 h-8 bg-white border border-stone-300 rounded-full hover:bg-pizza-50 hover:text-pizza-500 hover:border-pizza-300 transition-all shadow-sm"
                                title="新增列"
                             >
                                 <PlusIcon className="w-5 h-5" />
                             </button>
                         </div>
                    )}
                </div>
            </div>
        );

    default:
      return isEditing ? (
        <textarea 
            value={block.content} 
            onChange={e => onUpdate(block.id, e.target.value)} 
            className={`${commonClasses} text-stone-600 leading-relaxed min-h-[1.5em]`} 
            placeholder="輸入內容..." 
            rows={Math.max(1, block.content.split('\n').length)}
        />
      ) : <p className="text-stone-600 leading-relaxed whitespace-pre-wrap min-h-[1.5em]">{parseText(block.content) || <br/>}</p>;
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
  
  // Preview Mode State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // Link Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const canManage = ['admin', 'duty'].includes(userRole);
  const canEdit = canManage && !isPreviewMode;

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevBlocksLength = useRef(0);

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
        prevBlocksLength.current = (mappedItem.content || []).length;
      }
      setLoading(false);
    };
    fetchItem();
  }, [itemId, navigate]);

  // Auto-scroll to bottom when a new block is added
  useEffect(() => {
      if (blocks.length > prevBlocksLength.current) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      prevBlocksLength.current = blocks.length;
  }, [blocks.length]);

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
  
  const handleLinkConfirm = (text: string, url: string) => {
      const newBlock: SOPBlock = {
          id: crypto.randomUUID(),
          type: 'text',
          content: `[${text}](${url})`,
          props: {}
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

  // Calculate indexes for number lists
  let listIndex = 1;

  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-12 pb-32 max-w-4xl relative">
        <LinkInputModal 
            isOpen={linkModalOpen} 
            onClose={() => setLinkModalOpen(false)} 
            onConfirm={handleLinkConfirm} 
        />

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

        {/* Floating Toolbar (Right Side) */}
        {canEdit && (
            <div className="fixed right-24 top-24 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-2xl border border-stone-200 animate-fade-in">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 text-center">工具</p>
                <Tooltip text="一般文字"><button onClick={() => addBlock('text')} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><TypeIcon/></button></Tooltip>
                <Tooltip text="連結"><button onClick={() => setLinkModalOpen(true)} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><LinkIcon/></button></Tooltip>
                <Tooltip text="圖片"><button onClick={() => addBlock('image')} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><ImageIcon/></button></Tooltip>
                <Tooltip text="影片"><button onClick={() => addBlock('video')} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><VideoIcon/></button></Tooltip>
                <Tooltip text="表格"><button onClick={() => addBlock('table')} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><TableIcon/></button></Tooltip>
                <div className="h-px bg-stone-200 my-1 w-full"></div>
                <Tooltip text="大標題"><button onClick={() => addBlock('heading-1')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-playfair font-bold text-sm text-stone-600">H1</button></Tooltip>
                <Tooltip text="中標題"><button onClick={() => addBlock('heading-2')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-playfair font-bold text-xs text-stone-600">H2</button></Tooltip>
                <div className="h-px bg-stone-200 my-1 w-full"></div>
                <Tooltip text="提示框"><button onClick={() => addBlock('callout')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-xs text-stone-600">💡</button></Tooltip>
                <Tooltip text="折疊"><button onClick={() => addBlock('toggle')} className="p-2.5 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all text-stone-500"><ToggleIcon/></button></Tooltip>
                <Tooltip text="清單"><button onClick={() => addBlock('bullet-list')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-xs text-stone-600">•</button></Tooltip>
                <Tooltip text="編號"><button onClick={() => addBlock('number-list')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-xs text-stone-600">1.</button></Tooltip>
                <Tooltip text="分隔線"><button onClick={() => addBlock('divider')} className="px-2 py-2 bg-white border border-stone-200 rounded-xl hover:border-pizza-400 hover:text-pizza-500 shadow-sm transition-all font-bold text-stone-400">—</button></Tooltip>
            </div>
        )}

        {/* Header Area */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex-grow">
                <Link to="/training-items" className="text-xs font-bold text-stone-400 hover:text-pizza-500 uppercase tracking-widest mb-4 block">← 返回任務列表</Link>
                <h1 className="text-4xl md:text-5xl font-playfair font-bold text-stone-900 mb-4">{item.name}</h1>
                <div className="flex gap-3">
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.workArea}</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.typeTag}</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{item.chapter}</span>
                </div>
            </div>
            
            {canManage && (
                <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isPreviewMode ? 'bg-pizza-500 text-white shadow-lg' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}
                >
                    {isPreviewMode ? <EyeSlashIcon /> : <EyeIcon />}
                    {isPreviewMode ? '結束預覽' : '預覽模式'}
                </button>
            )}
        </div>

        {/* Editor Canvas */}
        <div className="glass-panel p-8 md:p-12 rounded-3xl min-h-[60vh] bg-white shadow-xl border border-white relative z-0">
            {blocks.length === 0 && canEdit && (
                <div className="text-center py-20 text-stone-300 font-serif border-2 border-dashed border-stone-100 rounded-2xl mb-8">
                    點擊右側工具列開始建立 SOP 內容
                </div>
            )}
            
            <div className="space-y-2">
                {blocks.map((block, index) => {
                    let currentIndex = undefined;
                    if (block.type === 'number-list') {
                        currentIndex = listIndex++;
                    } else {
                        listIndex = 1;
                    }

                    return (
                        <div key={block.id} className="group relative pl-2 pr-2 rounded-lg hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                            {/* Action Buttons (Inline) */}
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
                                indexContext={currentIndex}
                            />
                        </div>
                    );
                })}
            </div>
            <div ref={bottomRef} className="h-10 w-full"></div>
        </div>

        {/* Floating Save Button */}
        {canEdit && (
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 mr-20"> 
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
