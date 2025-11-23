
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { type Announcement, type SOPBlock, type BlockType, type UserRole, type AnnouncementRead, type TagData } from '../types';
import Tooltip from '../components/Tooltip';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import Calendar from '../components/Calendar';

// Reusing icons from other files for consistency
const ChevronUpIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
const ChevronDownIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const ImageIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const VideoIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TypeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TableIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

// --- Block Renderer (Copied to be independent) ---
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
                        <img src={block.content} alt="Content" className="rounded-xl shadow-sm max-w-full h-auto max-h-[500px] object-contain mx-auto border border-stone-100" />
                        {isEditing && (
                            <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="absolute bottom-2 left-2 right-2 glass-input text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" placeholder="圖片網址..." />
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
                             <input type="text" value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className="absolute bottom-2 left-2 right-2 glass-input text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" placeholder="影片網址..." />
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
    case 'divider':
        return <hr className="my-8 border-t-2 border-stone-100" />;
    default:
      return isEditing ? (
        <textarea ref={textareaRef} value={block.content} onChange={e => onUpdate(block.id, e.target.value)} className={`${commonClasses} text-stone-600 leading-relaxed min-h-[1.5em]`} placeholder="輸入內容..." rows={1} />
      ) : <p className="text-stone-600 leading-relaxed whitespace-pre-wrap min-h-[1.5em]">{block.content || <br/>}</p>;
  }
};

const AnnouncementDetailPage: React.FC<{ userRole: UserRole; userId: string }> = ({ userRole, userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [blocks, setBlocks] = useState<SOPBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [readBy, setReadBy] = useState<AnnouncementRead[]>([]);
  
  // Settings for Admin
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetStations, setTargetStations] = useState<string[]>([]);
  
  // Dynamic Tags from DB
  const [contentTags, setContentTags] = useState<TagData[]>([]);
  const [roleTags, setRoleTags] = useState<TagData[]>([]);
  const [stationTags, setStationTags] = useState<TagData[]>([]);
  
  // Cycle Logic
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); // 1=Mon, ..., 6=Sat, 0=Sun
  const [category, setCategory] = useState<string>('');
  const [dates, setDates] = useState<{start: string, end: string}>({start: '', end: ''});
  const [isPermanent, setIsPermanent] = useState(false);

  // Calendar Modal State
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const canEdit = userRole === 'admin';
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasReadRef = useRef(false);
  
  // Ref for closing calendar on outside click
  const calendarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
            setIsStartCalendarOpen(false);
            setIsEndCalendarOpen(false);
        }
    };
    if (isStartCalendarOpen || isEndCalendarOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStartCalendarOpen, isEndCalendarOpen]);

  const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single();
      if (error) {
        navigate('/announcement-list');
        return;
      }

      const anno = data as any;
      setAnnouncement(anno);
      setBlocks(anno.content || []);
      setTargetRoles(anno.target_roles || []);
      setTargetStations(anno.target_stations || []);
      
      // Parse Cycle Type
      const rawCycleType = anno.cycle_type || 'daily';
      if (rawCycleType.startsWith('weekly:')) {
          const daysStr = rawCycleType.split(':')[1];
          if (daysStr) {
              setSelectedWeekDays(daysStr.split(',').map(Number));
          }
      } else {
          // If 'daily' or 'fixed', just clear weekdays
          setSelectedWeekDays([]);
      }

      setCategory(anno.category || '');
      setDates({ start: anno.start_date || '', end: anno.end_date || '' });
      setIsPermanent(!anno.end_date);

      // Fetch Tags
      const { data: tagsData } = await supabase.from('tags').select('*').in('category', ['anno_category', 'job', 'station']);
      if (tagsData) {
          setContentTags(tagsData.filter((t: any) => t.category === 'anno_category'));
          setRoleTags(tagsData.filter((t: any) => t.category === 'job'));
          setStationTags(tagsData.filter((t: any) => t.category === 'station'));
      }

      if (userRole === 'admin') {
          // Fetch reads
          const { data: reads } = await supabase
            .from('announcement_reads')
            .select('*, personnel:personnel_id(name)')
            .eq('announcement_id', id);
            
          if (reads) {
              setReadBy(reads.map((r: any) => ({
                  announcement_id: r.announcement_id,
                  personnel_id: r.personnel_id,
                  read_at: r.read_at,
                  personnel_name: r.personnel?.name
              })));
          }
      } else {
          // Check if already read by current user
          const { data: myRead } = await supabase
            .from('announcement_reads')
            .select('*')
            .eq('announcement_id', id)
            .eq('personnel_id', userId)
            .single();
          if (myRead) hasReadRef.current = true;
      }
      setLoading(false);
  };

  // Mark as read logic for non-admins
  useEffect(() => {
    if (canEdit || hasReadRef.current || !id) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !hasReadRef.current) {
            markAsRead();
        }
    }, { threshold: 1.0 });

    if (bottomRef.current) observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, [loading, canEdit, id]);

  const markAsRead = async () => {
      hasReadRef.current = true;
      await supabase.from('announcement_reads').upsert({
          announcement_id: id,
          personnel_id: userId,
          read_at: new Date().toISOString()
      }, { onConflict: 'announcement_id,personnel_id' });
  };

  const handleSave = async () => {
    if (!id) return;
    
    // Validation
    if (!announcement?.title?.trim()) {
        alert('請輸入公告標題');
        return;
    }

    // Determine Cycle Type Implicitly
    let finalCycleType = 'daily';
    if (selectedWeekDays.length > 0) {
        finalCycleType = `weekly:${selectedWeekDays.join(',')}`;
    }

    setSaving(true);
    const { error } = await supabase
        .from('announcements')
        .update({ 
            content: blocks,
            target_roles: targetRoles,
            target_stations: targetStations,
            cycle_type: finalCycleType,
            category: category,
            start_date: dates.start,
            end_date: isPermanent ? null : (dates.end || null),
            title: announcement.title
        })
        .eq('id', id);
    
    if (!error) {
        setLastSaved(new Date());
        alert('儲存成功！');
    } else {
        if (error.code === 'PGRST204') {
             alert('儲存失敗：資料庫欄位不符。請聯繫開發人員或在後台更新資料庫 Schema (補上 cycle_type 欄位)。');
        } else {
             alert('儲存失敗：' + error.message);
        }
    }
    setSaving(false);
  };

  // --- Block Ops ---
  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, { id: crypto.randomUUID(), type, content: '', props: type === 'callout' ? { color: 'amber' } : {} }]);
  };
  const updateBlock = (bid: string, content: string) => setBlocks(prev => prev.map(b => b.id === bid ? { ...b, content } : b));
  const updateBlockProps = (bid: string, props: any) => setBlocks(prev => prev.map(b => b.id === bid ? { ...b, props: { ...b.props, ...props } } : b));
  const deleteBlock = (bid: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setConfirmState({ message: '確定刪除此區塊？', onConfirm: () => { setBlocks(prev => prev.filter(b => b.id !== bid)); setConfirmState(null); } });
  };
  const moveBlock = (index: number, dir: 'up'|'down') => {
      const newBlocks = [...blocks];
      if (dir === 'up' && index > 0) [newBlocks[index], newBlocks[index-1]] = [newBlocks[index-1], newBlocks[index]];
      else if (dir === 'down' && index < newBlocks.length -1) [newBlocks[index], newBlocks[index+1]] = [newBlocks[index+1], newBlocks[index]];
      setBlocks(newBlocks);
  };

  const toggleWeekDay = (day: number) => {
      if (selectedWeekDays.includes(day)) setSelectedWeekDays(prev => prev.filter(d => d !== day));
      else setSelectedWeekDays(prev => [...prev, day]);
  };

  // Calendar Helpers
  const handleDateSelect = (dateStr: string) => {
      if (isStartCalendarOpen) {
          setDates(prev => ({ ...prev, start: dateStr }));
          setIsStartCalendarOpen(false);
      } else if (isEndCalendarOpen) {
          setDates(prev => ({ ...prev, end: dateStr }));
          setIsEndCalendarOpen(false);
      }
  };

  const openCalendar = (type: 'start' | 'end') => {
      if (type === 'end' && isPermanent) return;

      const initialDateStr = type === 'start' ? dates.start : dates.end;
      const initialDate = initialDateStr ? new Date(initialDateStr) : new Date();
      if (isNaN(initialDate.getTime())) setCalendarViewDate(new Date());
      else setCalendarViewDate(initialDate);

      if (type === 'start') {
          setIsStartCalendarOpen(true);
          setIsEndCalendarOpen(false);
      } else {
          setIsEndCalendarOpen(true);
          setIsStartCalendarOpen(false);
      }
  };

  const weekDaysUI = [
      { label: '一', val: 1 },
      { label: '二', val: 2 },
      { label: '三', val: 3 },
      { label: '四', val: 4 },
      { label: '五', val: 5 },
      { label: '六', val: 6 },
      { label: '日', val: 0 },
  ];

  if (loading) return <div className="min-h-screen flex justify-center items-center">載入中...</div>;
  if (!announcement) return null;

  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-12 pb-32 max-w-4xl relative">
        {/* Modal */}
        {confirmState && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                    <p className="text-center mb-4 font-bold text-stone-800">{confirmState.message}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmState(null)} className="flex-1 py-2 bg-stone-100 rounded-lg text-xs font-bold">取消</button>
                        <button onClick={confirmState.onConfirm} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold">確認</button>
                    </div>
                </div>
            </div>
        )}

        <div className="mb-8">
            <Link to={userRole === 'admin' ? "/announcement-list" : "/"} className="text-xs font-bold text-stone-400 hover:text-pizza-500 uppercase tracking-widest mb-4 block">← 返回列表</Link>
            
            {canEdit ? (
                <div className="glass-panel p-8 rounded-3xl mb-8 bg-white border border-stone-200 shadow-sm">
                    {/* Title */}
                    <input 
                        value={announcement.title} 
                        onChange={e => setAnnouncement({...announcement, title: e.target.value})}
                        className="text-3xl md:text-4xl font-playfair font-bold text-stone-900 w-full bg-transparent outline-none mb-8 placeholder-stone-300 border-b border-transparent focus:border-stone-200 pb-2 transition-all"
                        placeholder="公告標題"
                    />

                    <div className="space-y-6">
                        {/* 1. Category (Content) - Tags */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-2 tracking-widest">內容</label>
                            <div className="flex flex-wrap gap-2">
                                {contentTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => setCategory(tag.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                            category === tag.value
                                                ? 'bg-pizza-500 text-white border-pizza-500 shadow-md'
                                                : 'bg-white text-stone-500 border-stone-200 hover:border-pizza-300'
                                        }`}
                                    >
                                        {tag.value}
                                    </button>
                                ))}
                                {contentTags.length === 0 && <p className="text-xs text-stone-400">尚無內容標籤，請至公告管理頁面新增。</p>}
                            </div>
                        </div>

                        {/* 2. Date Range Block - With Custom Calendar Popover */}
                        <div className="relative" ref={calendarRef}>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-bold uppercase text-stone-500 tracking-widest">公告有效期間</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="permanentCheck"
                                        checked={isPermanent}
                                        onChange={(e) => setIsPermanent(e.target.checked)}
                                        className="rounded border-stone-300 text-pizza-500 focus:ring-pizza-500 cursor-pointer"
                                    />
                                    <label htmlFor="permanentCheck" className="text-xs font-bold text-stone-600 cursor-pointer select-none">永久公告</label>
                                </div>
                            </div>
                            
                            <div className="p-1 bg-stone-100/50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-0.5">
                                 {/* Start Date */}
                                 <div 
                                    onClick={() => openCalendar('start')}
                                    className={`flex-1 relative bg-white rounded-xl sm:rounded-r-none sm:rounded-l-xl p-3 hover:bg-stone-50 transition-colors group cursor-pointer ${isStartCalendarOpen ? 'ring-2 ring-pizza-500 z-20' : ''}`}
                                 >
                                    <span className="absolute top-2 left-3 text-[10px] text-stone-400 font-bold uppercase tracking-wider">起始日期</span>
                                    <div className="w-full pt-4 pb-1 px-1 text-stone-800 font-bold font-mono text-sm">
                                        {dates.start || <span className="text-stone-300">選擇日期</span>}
                                    </div>
                                 </div>
                                 <div className="w-full sm:w-px bg-stone-200"></div>
                                 {/* End Date */}
                                 <div 
                                    onClick={() => openCalendar('end')}
                                    className={`flex-1 relative rounded-xl sm:rounded-l-none sm:rounded-r-xl p-3 transition-colors group ${isPermanent ? 'bg-stone-50 cursor-not-allowed opacity-50' : 'bg-white hover:bg-stone-50 cursor-pointer'} ${isEndCalendarOpen ? 'ring-2 ring-pizza-500 z-20' : ''}`}
                                 >
                                    <span className="absolute top-2 left-3 text-[10px] text-stone-400 font-bold uppercase tracking-wider">結束日期 (選填)</span>
                                    <div className="w-full pt-4 pb-1 px-1 text-stone-800 font-bold font-mono text-sm">
                                        {isPermanent ? '永久有效' : (dates.end || <span className="text-stone-300">選擇日期</span>)}
                                    </div>
                                 </div>
                            </div>
                            
                            {/* Calendar Popover */}
                            {(isStartCalendarOpen || isEndCalendarOpen) && (
                                <div className={`absolute z-50 top-full mt-2 shadow-2xl animate-fade-in ${isStartCalendarOpen ? 'left-0' : 'right-0'}`}>
                                    <Calendar 
                                        currentDate={calendarViewDate}
                                        onMonthChange={(offset) => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1))}
                                        onDateSet={(date) => setCalendarViewDate(date)}
                                        onDateClick={handleDateSelect}
                                        simpleMode={true}
                                        activeDate={isStartCalendarOpen ? dates.start : dates.end}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. Announcement Cycle (Weekdays) */}
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-4 text-center tracking-widest">公告週期 (選擇重複星期)</label>
                            <div className="flex justify-center gap-4 flex-wrap">
                                {weekDaysUI.map(d => (
                                    <button
                                        key={d.val}
                                        onClick={() => toggleWeekDay(d.val)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-sm md:text-base transition-all shadow-sm flex items-center justify-center ${
                                            selectedWeekDays.includes(d.val)
                                                ? 'bg-pizza-500 text-white transform scale-110 shadow-pizza-200/50'
                                                : 'bg-white text-stone-400 border border-stone-200 hover:border-pizza-300 hover:text-pizza-500'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-stone-400 mt-3 font-bold">
                                {selectedWeekDays.length === 0 ? '目前設定：每日重複 (依照有效期間)' : '目前設定：每週重複指定星期'}
                            </p>
                        </div>

                        {/* 4. Targets */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-100">
                            <div>
                                <label className="block text-xs font-bold uppercase text-stone-500 mb-3 tracking-widest">目標職等</label>
                                <div className="flex gap-2 flex-wrap">
                                    {roleTags.map(tag => (
                                        <button key={tag.id} onClick={() => {
                                            if (targetRoles.includes(tag.value)) setTargetRoles(targetRoles.filter(x => x !== tag.value));
                                            else setTargetRoles([...targetRoles, tag.value]);
                                        }} className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${targetRoles.includes(tag.value) ? 'bg-pizza-500 text-white border-pizza-500 shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                                            {tag.value}
                                        </button>
                                    ))}
                                    {roleTags.length === 0 && <p className="text-xs text-stone-400">無職等標籤</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-stone-500 mb-3 tracking-widest">目標站區</label>
                                <div className="flex gap-2 flex-wrap">
                                    {stationTags.map(tag => (
                                        <button key={tag.id} onClick={() => {
                                            if (targetStations.includes(tag.value)) setTargetStations(targetStations.filter(x => x !== tag.value));
                                            else setTargetStations([...targetStations, tag.value]);
                                        }} className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${targetStations.includes(tag.value) ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                                            {tag.value}
                                        </button>
                                    ))}
                                    {stationTags.length === 0 && <p className="text-xs text-stone-400">無站區標籤</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-stone-900 mb-4">{announcement.title}</h1>
                    <div className="flex gap-3 mb-6">
                        <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{announcement.category}</span>
                        <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">{announcement.start_date}</span>
                    </div>
                </>
            )}
        </div>

        {/* Content */}
        <div className="glass-panel p-8 md:p-12 rounded-3xl min-h-[40vh] bg-white shadow-xl relative z-0 border border-white">
            {blocks.map((block, index) => (
                <div key={block.id} className="group relative">
                    {canEdit && (
                         <div className="absolute right-0 -top-8 flex gap-1 bg-white shadow-sm border border-stone-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => moveBlock(index, 'up')} className="p-1 hover:bg-stone-100 rounded"><ChevronUpIcon/></button>
                            <button onClick={() => moveBlock(index, 'down')} className="p-1 hover:bg-stone-100 rounded"><ChevronDownIcon/></button>
                            <button onClick={(e) => deleteBlock(block.id, e)} className="p-1 hover:bg-red-50 text-red-500 rounded"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    )}
                    <BlockRenderer 
                        block={block} 
                        isEditing={canEdit} 
                        onUpdate={updateBlock} 
                        onUpdateProps={updateBlockProps} 
                        onConfirmAction={(msg, action) => {
                             setConfirmState({ message: msg, onConfirm: () => { action(); setConfirmState(null); } });
                        }}
                    />
                </div>
            ))}
            
            {canEdit && (
                <div className="mt-12 pt-8 border-t border-stone-100 flex justify-center gap-3">
                    <button onClick={() => addBlock('text')} className="p-2 border rounded hover:bg-stone-50"><TypeIcon/></button>
                    <button onClick={() => addBlock('heading-1')} className="px-3 py-2 border rounded font-serif font-bold hover:bg-stone-50">H1</button>
                    <button onClick={() => addBlock('heading-2')} className="px-3 py-2 border rounded font-serif font-bold hover:bg-stone-50">H2</button>
                    <button onClick={() => addBlock('image')} className="p-2 border rounded hover:bg-stone-50"><ImageIcon/></button>
                    <button onClick={() => addBlock('video')} className="p-2 border rounded hover:bg-stone-50"><VideoIcon/></button>
                    <button onClick={() => addBlock('bullet-list')} className="px-3 py-2 border rounded font-bold text-xs hover:bg-stone-50">• List</button>
                    <button onClick={() => addBlock('divider')} className="px-3 py-2 border rounded font-bold text-xs hover:bg-stone-50">—</button>
                </div>
            )}
            
            {/* Scroll Anchor */}
            <div ref={bottomRef} className="h-10 w-full"></div>
        </div>

        {canEdit && (
            <>
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
                    {lastSaved && <span className="text-[10px] font-bold text-stone-400 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">已儲存: {lastSaved.toLocaleTimeString()}</span>}
                    <button onClick={handleSave} disabled={saving} className="texture-grain flex items-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-full shadow-2xl hover:bg-pizza-500 hover:scale-105 transition-all font-bold text-sm uppercase tracking-widest">
                        {saving ? '...' : <><SaveIcon /> 儲存公告</>}
                    </button>
                </div>

                {/* Read Receipts */}
                <div className="mt-12 glass-panel p-8 rounded-3xl bg-white/60">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">當日已閱讀者 ({readBy.filter(r => new Date(r.read_at).toDateString() === new Date().toDateString()).length})</h3>
                    {readBy.length === 0 ? <p className="text-stone-400 text-xs">尚未有人閱讀</p> : (
                        <div className="flex flex-wrap gap-2">
                            {readBy.map(r => {
                                const isToday = new Date(r.read_at).toDateString() === new Date().toDateString();
                                return (
                                    <span key={r.personnel_id} className={`px-3 py-1 rounded-full text-xs font-bold ${isToday ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'}`}>
                                        {r.personnel_name} {isToday ? '' : '(過往)'}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>
            </>
        )}
    </div>
  );
};

export default AnnouncementDetailPage;
