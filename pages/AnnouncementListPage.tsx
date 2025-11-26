
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { type Announcement, type TagData } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import Tag from '../components/Tag';
import { TrashIcon } from '../components/icons/TrashIcon';

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
}> = ({ isOpen, onClose, onConfirm, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-fade-in border border-stone-100" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">確認刪除</h3>
                    <p className="text-sm text-stone-500 mt-2">{title}</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-sm transition-colors uppercase tracking-wider"
                    >
                        取消
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors uppercase tracking-wider"
                    >
                        確認刪除
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditTagModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    tag: TagData | null;
    onSave: (id: string, name: string, color: string) => Promise<void>;
    onDelete: (id: string, e: React.MouseEvent) => void;
}> = ({ isOpen, onClose, tag, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('sky');

    useEffect(() => {
        if (tag) {
            setName(tag.value);
            setColor(tag.color || 'sky');
        }
    }, [tag]);

    if (!isOpen || !tag) return null;

    const colors = ['slate', 'sky', 'green', 'amber', 'red', 'indigo', 'pink', 'purple'];
    
    const getColorClass = (c: string) => {
        switch(c) {
            case 'slate': return 'bg-stone-400';
            case 'sky': return 'bg-sky-400';
            case 'green': return 'bg-emerald-400';
            case 'amber': return 'bg-amber-400';
            case 'red': return 'bg-red-400';
            case 'indigo': return 'bg-indigo-400';
            case 'pink': return 'bg-rose-400';
            case 'purple': return 'bg-violet-400';
            default: return 'bg-stone-200';
        }
    };

    const handleSubmit = () => {
        if (name.trim()) {
            onSave(tag.id, name, color);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="glass-panel bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-fade-in border border-white" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-stone-800 mb-6">編輯標籤</h3>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-2 tracking-widest">名稱</label>
                        <input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="glass-input w-full px-4 py-2 rounded-xl"
                            placeholder="輸入標籤名稱"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-2 tracking-widest">顏色</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full ${getColorClass(c)} ${color === c ? 'ring-4 ring-stone-200 scale-110' : 'hover:scale-105'} transition-all`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                         <Tag color={color}>{name || '預覽'}</Tag>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                     <button 
                        onClick={(e) => onDelete(tag.id, e)}
                        className="text-red-500 text-xs font-bold uppercase hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                     >
                         <TrashIcon className="w-4 h-4"/> 刪除
                     </button>
                     <div className="flex gap-2">
                         <button onClick={onClose} className="px-4 py-2 rounded-lg text-stone-500 text-xs font-bold uppercase hover:bg-stone-50">取消</button>
                         <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-pizza-500 text-white text-xs font-bold uppercase shadow-lg hover:bg-pizza-600">儲存</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

// Configuration for Tabs
const TAB_CONFIG = {
    content: { dbCategory: 'anno_category', label: '公告內容' },
    role: { dbCategory: 'job', label: '目標職等' },
    station: { dbCategory: 'station', label: '目標站區' }
};

type TabType = keyof typeof TAB_CONFIG;

const AnnouncementListPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | string[]; type: 'anno' | 'tag' } | null>(null);
  
  // Tag Management
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [newTagVal, setNewTagVal] = useState('');
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: annos } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    // Fetch tags for announcements, jobs, and stations
    const { data: tags } = await supabase.from('tags').select('*').in('category', ['anno_category', 'job', 'station']);
    
    if (annos) setAnnouncements(annos as any);
    if (tags) setAllTags(tags as any);
    setLoading(false);
  };

  const createAnno = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCreating) return;
    setIsCreating(true);

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayLocal = `${year}-${month}-${day}`;
        
        // Find default category tag
        const contentTags = allTags.filter(t => t.category === 'anno_category');

        const { data, error } = await supabase.from('announcements').insert({
            title: '未命名公告',
            content: [],
            category: contentTags[0]?.value || '一般',
            cycle_type: 'daily',
            target_roles: ['一般員工'],
            target_stations: ['全體'],
            start_date: todayLocal,
            is_active: true
        }).select().single();

        if (error) {
            if (error.code === 'PGRST204') {
                 throw new Error(`資料庫結構不符 (PGRST204)。請執行 SQL 補上 cycle_type 欄位。`);
            }
            throw new Error(error.message);
        }

        if (data) {
            navigate(`/announcement/${data.id}`);
        }
    } catch (err: any) {
        alert(`建立公告失敗: ${err.message || '未知錯誤'}\n請確認您的權限或是網路狀態。`);
    } finally {
        setIsCreating(false);
    }
  };

  const handleDeleteClick = (id: string, type: 'anno' | 'tag', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDeleteTarget({ id, type });
  };
  
  const handleBatchDeleteClick = () => {
      if (selectedItems.size === 0) return;
      setDeleteTarget({ id: Array.from(selectedItems), type: 'anno' });
  };

  const executeDelete = async () => {
      if (!deleteTarget) return;
      const { id, type } = deleteTarget;

      let error = null;
      if (type === 'anno') {
          if (Array.isArray(id)) {
              // Batch delete
              const { error: err } = await supabase.from('announcements').delete().in('id', id);
              error = err;
          } else {
              // Single delete
              const { error: err } = await supabase.from('announcements').delete().eq('id', id);
              error = err;
          }
      } else {
          // Tag delete
          const { error: err } = await supabase.from('tags').delete().eq('id', id as string);
          error = err;
      }

      if (error) {
          alert(`刪除失敗：${error.message}`);
      } else {
          fetchData();
          if (type === 'tag') setEditingTag(null);
          setSelectedItems(new Set()); // Clear selection
      }
      setDeleteTarget(null);
  };

  const addTag = async () => {
      if(!newTagVal.trim()) return;
      const dbCategory = TAB_CONFIG[activeTab].dbCategory;

      const { error } = await supabase.from('tags').insert({
          id: crypto.randomUUID(),
          category: dbCategory,
          value: newTagVal,
          color: 'sky' 
      });
      if (error) alert('新增失敗: ' + error.message);
      else {
          setNewTagVal('');
          fetchData();
      }
  };

  const handleUpdateTag = async (id: string, name: string, color: string) => {
      const { error } = await supabase.from('tags').update({ value: name, color: color }).eq('id', id);
      if (error) alert('更新失敗: ' + error.message);
      else fetchData();
  };
  
  // Selection Logic
  const handleToggleSelect = (id: string) => {
      setSelectedItems(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };
  
  const handleSelectAll = () => {
      if (selectedItems.size === filteredAnnos.length) {
          setSelectedItems(new Set());
      } else {
          setSelectedItems(new Set(filteredAnnos.map(a => a.id)));
      }
  };

  if (loading) return <div className="p-10 text-center text-stone-500 font-bold">載入中...</div>;

  const currentTags = allTags.filter(t => t.category === TAB_CONFIG[activeTab].dbCategory);
  
  const filteredAnnos = announcements.filter(a => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.target_roles || []).some(r => r.toLowerCase().includes(q)) ||
          (a.target_stations || []).some(s => s.toLowerCase().includes(q))
      );
  });

  return (
    <div className="container mx-auto p-6 sm:p-10 relative">
        <DeleteConfirmationModal 
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={executeDelete}
            title={
                deleteTarget?.type === 'anno' 
                    ? Array.isArray(deleteTarget.id) 
                        ? `確定刪除選取的 ${deleteTarget.id.length} 筆公告？此動作無法復原。`
                        : '確定刪除此公告？此動作無法復原。' 
                    : '確定刪除此標籤？'
            }
        />

        <EditTagModal 
            isOpen={!!editingTag}
            onClose={() => setEditingTag(null)}
            tag={editingTag}
            onSave={handleUpdateTag}
            onDelete={(id, e) => handleDeleteClick(id, 'tag', e)}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <Link to="/" className="text-xs font-bold text-stone-400 hover:text-pizza-500 uppercase tracking-widest mb-2 block">← 返回首頁</Link>
                <h1 className="text-4xl font-playfair font-bold text-stone-900">公告管理</h1>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={createAnno} 
                    disabled={isCreating}
                    className={`texture-grain flex-1 md:flex-none px-6 py-3 bg-stone-900 text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-pizza-500 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 ${isCreating ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isCreating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <PlusIcon className="w-4 h-4"/>
                    )}
                    {isCreating ? '處理中...' : '新增公告'}
                </button>
            </div>
        </div>
        
        {/* Search & Bulk Actions Bar */}
        <div className="mb-6 p-2 bg-stone-100 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋公告..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-white text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-pizza-200 transition-all placeholder:text-stone-400 shadow-sm"
                />
                <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            
            {selectedItems.size > 0 && (
                <div className="flex items-center gap-4 px-2 animate-fade-in w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">已選取 {selectedItems.size} 筆</span>
                    <button 
                        onClick={handleBatchDeleteClick}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                        <TrashIcon className="w-4 h-4"/> 刪除選取
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Tag Management */}
            <div className="md:col-span-1 space-y-6">
                <div className="glass-panel p-6 rounded-2xl bg-white border border-stone-200">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">標籤管理</h3>
                    
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl">
                        {(Object.keys(TAB_CONFIG) as TabType[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white shadow-sm text-pizza-600' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                {TAB_CONFIG[tab].label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input value={newTagVal} onChange={e => setNewTagVal(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" placeholder="新標籤名稱..." />
                        <button onClick={addTag} className="bg-stone-100 hover:bg-pizza-100 text-stone-600 rounded-lg px-3"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {currentTags.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setEditingTag(t)}
                                className="group relative hover:scale-105 transition-transform focus:outline-none"
                                title="點擊編輯"
                            >
                                <Tag color={t.color}>{t.value}</Tag>
                            </button>
                        ))}
                        {currentTags.length === 0 && <p className="text-xs text-stone-400">無標籤</p>}
                    </div>
                    <p className="text-[10px] text-stone-400 mt-4 text-center">點擊標籤可進行編輯或刪除</p>
                </div>
            </div>

            {/* Right: List */}
            <div className="md:col-span-2 space-y-4">
                {/* Select All Header */}
                <div className="flex items-center gap-3 px-4 mb-2">
                     <input 
                        type="checkbox" 
                        checked={filteredAnnos.length > 0 && selectedItems.size === filteredAnnos.length}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded border-stone-300 text-pizza-500 focus:ring-pizza-500 cursor-pointer"
                     />
                     <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">全選</span>
                </div>

                {filteredAnnos.map(a => (
                    <div key={a.id} className="glass-card p-4 sm:p-6 rounded-2xl border border-white hover:border-pizza-300 bg-white/60 group relative flex gap-4 items-start" >
                        
                        {/* Checkbox */}
                        <div className="pt-1">
                             <input 
                                type="checkbox" 
                                checked={selectedItems.has(a.id)}
                                onChange={() => handleToggleSelect(a.id)}
                                className="w-5 h-5 rounded border-stone-300 text-pizza-500 focus:ring-pizza-500 cursor-pointer"
                             />
                        </div>

                        <div className="flex-grow cursor-pointer" onClick={() => navigate(`/announcement/${a.id}`)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-pizza-600 transition-colors">{a.title}</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase rounded">
                                            {a.cycle_type && a.cycle_type.startsWith('weekly') ? '每週重複' : a.cycle_type === 'monthly' ? '每月1號' : a.cycle_type === 'fixed' ? '指定日期' : '每日'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold uppercase rounded">{a.category}</span>
                                        {(a.target_stations as string[])?.map(s => <span key={s} className="px-2 py-0.5 bg-stone-50 text-stone-400 text-[10px] rounded">{s}</span>)}
                                    </div>
                                </div>
                                {/* Delete Button - Stops propagation to allow checkbox/navigation separation */}
                                <button 
                                    onClick={(e) => handleDeleteClick(a.id, 'anno', e)} 
                                    className="text-stone-300 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50 z-10"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredAnnos.length === 0 && (
                    <div className="glass-card p-10 text-center rounded-2xl border border-white bg-white/40">
                         <p className="text-stone-400 font-serif">
                             {searchQuery ? '找不到符合的公告' : '尚無公告'}
                         </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AnnouncementListPage;
