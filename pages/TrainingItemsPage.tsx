
import React, { useState, useMemo, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { type TrainingItem, type TagData, type TagColor, type Personnel, type UserRole } from '../types';
import { TrashIcon } from '../components/icons/TrashIcon';
import Tag from '../components/Tag';
import Importer from '../components/Importer';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const AssignToPersonnelModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAssign: (personnelIds: Set<string>) => void;
  personnelList: Personnel[];
}> = ({ isOpen, onClose, onAssign, personnelList }) => {
  const [selectedPersonnel, setSelectedPersonnel] = useState(new Set<string>());
  const activePersonnel = personnelList.filter(p => p.status === '在職');

  const handleToggle = (id: string) => {
    setSelectedPersonnel(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPersonnel.size === activePersonnel.length) setSelectedPersonnel(new Set());
    else setSelectedPersonnel(new Set(activePersonnel.map(p => p.id)));
  };

  const handleConfirm = () => {
    onAssign(selectedPersonnel);
    onClose();
    setSelectedPersonnel(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="glass-panel rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col bg-white shadow-2xl">
        <div className="p-6 border-b border-stone-200">
          <h3 className="text-xl font-bold text-stone-800">指派任務</h3>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center p-4 mb-2 bg-stone-100 rounded-xl">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-stone-400 bg-white text-pizza-500 focus:ring-pizza-500"
              checked={selectedPersonnel.size === activePersonnel.length && activePersonnel.length > 0}
              onChange={handleSelectAll}
            />
            <label className="ml-4 text-sm font-bold text-stone-600 uppercase tracking-wider">全選</label>
          </div>
          <ul className="space-y-2">
            {activePersonnel.map(person => (
              <li key={person.id} className={`p-4 rounded-xl flex items-center transition-all ${selectedPersonnel.has(person.id) ? 'bg-pizza-50 border border-pizza-200' : 'hover:bg-stone-50 border border-transparent'}`}>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-stone-400 bg-white text-pizza-500 focus:ring-pizza-500"
                  checked={selectedPersonnel.has(person.id)}
                  onChange={() => handleToggle(person.id)}
                />
                <div className="ml-4">
                    <div className="text-base font-bold text-stone-800">{person.name}</div>
                    <div className="text-xs text-stone-500 font-bold">{person.jobTitle}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 border-t border-stone-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-100 transition-colors font-bold text-xs uppercase">取消</button>
          <button onClick={handleConfirm} className="texture-grain px-8 py-3 rounded-full bg-pizza-500 text-white hover:bg-pizza-600 shadow-lg font-bold text-xs uppercase tracking-widest" disabled={selectedPersonnel.size === 0}>確認指派</button>
        </div>
      </div>
    </div>
  );
};

const EditTagModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tagToEdit: TagData | null;
  tagType: TagType;
  allTags: TagData[];
  onSave: (type: TagType, id: string, name: string, color: string, replaceId?: string) => void;
  onDelete: (type: TagType, val: string) => void;
}> = ({ isOpen, onClose, tagToEdit, tagType, allTags, onSave, onDelete }) => {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<string>('slate');
  const [replacementTag, setReplacementTag] = useState('');
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 50 });
  const [showAdvancedColor, setShowAdvancedColor] = useState(false);

  useEffect(() => {
    if (tagToEdit) {
      setTagName(tagToEdit.value);
      setTagColor(tagToEdit.color);
      setReplacementTag('');
      setShowAdvancedColor(tagToEdit.color.startsWith('hsl'));
      
      // Try parse existing HSL or default
      if (tagToEdit.color.startsWith('hsl')) {
          const matches = tagToEdit.color.match(/\d+/g);
          if (matches && matches.length >= 3) {
              setHsl({ h: parseInt(matches[0]), s: parseInt(matches[1]), l: parseInt(matches[2]) });
          }
      }
    }
  }, [tagToEdit]);

  if (!isOpen || !tagToEdit) return null;

  const replacementOptions = allTags.filter(t => t.id !== tagToEdit.id);

  const handleSave = () => {
    onSave(tagType, tagToEdit.id, tagName, tagColor, replacementTag);
    onClose();
  };
  
  const updateHsl = (key: 'h'|'s'|'l', val: number) => {
      const newHsl = { ...hsl, [key]: val };
      setHsl(newHsl);
      setTagColor(`hsl(${newHsl.h}, ${newHsl.s}%, ${newHsl.l}%)`);
  };

  const presetColors = ['slate', 'sky', 'green', 'amber', 'red', 'indigo', 'pink', 'purple'];
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

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="glass-panel rounded-3xl w-full max-w-md shadow-2xl border border-white bg-white">
        <div className="p-8 border-b border-stone-100">
          <h3 className="text-xl font-bold text-stone-800">編輯標籤: <span className="text-pizza-500">{tagToEdit.value}</span></h3>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2 tracking-widest">標籤名稱</label>
            <input type="text" value={tagName} onChange={e => setTagName(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-3 tracking-widest">標籤顏色</label>
            <div className="flex flex-wrap gap-3 mb-4">
                {presetColors.map(c => (
                    <button 
                        key={c} 
                        onClick={() => { setTagColor(c); setShowAdvancedColor(false); }}
                        className={`w-8 h-8 rounded-full transition-all ${getColorClass(c)} ${tagColor === c ? 'ring-4 ring-stone-200 scale-110' : 'hover:scale-105'}`}
                    />
                ))}
                <button onClick={() => setShowAdvancedColor(!showAdvancedColor)} className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-400 hover:text-stone-600 text-xs">
                    +
                </button>
            </div>

            {showAdvancedColor && (
                <div className="space-y-3 bg-stone-50 p-4 rounded-xl animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-8">H</span>
                        <input type="range" min="0" max="360" value={hsl.h} onChange={e => updateHsl('h', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs w-8 text-right">{hsl.h}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-8">S</span>
                        <input type="range" min="0" max="100" value={hsl.s} onChange={e => updateHsl('s', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs w-8 text-right">{hsl.s}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-8">L</span>
                        <input type="range" min="0" max="100" value={hsl.l} onChange={e => updateHsl('l', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs w-8 text-right">{hsl.l}%</span>
                    </div>
                </div>
            )}
            
            <div className="mt-4 flex justify-center">
                <Tag color={tagColor} className="px-6 py-2 text-sm">{tagName || '預覽樣式'}</Tag>
            </div>
          </div>

          {replacementOptions.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-2 tracking-widest">合併並刪除</label>
              <select value={replacementTag} onChange={e => setReplacementTag(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl">
                <option value="" className="bg-white text-stone-800">不合併</option>
                {replacementOptions.map(t => <option key={t.id} value={t.id} className="bg-white text-stone-800">{t.value}</option>)}
              </select>
            </div>
          )}
        </div>
        
        <div className="p-8 pt-0 flex justify-between items-center">
           <button 
                onClick={() => {
                    // Custom modal instead of window.confirm for better UX
                    const confirmed = window.confirm(`確定要刪除標籤「${tagToEdit.value}」嗎？\n此操作無法復原。`);
                    if (confirmed) {
                        onDelete(tagType, tagToEdit.value);
                        onClose();
                    }
                }}
                className="text-red-500 hover:text-red-700 text-xs font-bold uppercase flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 transition-colors"
           >
               <TrashIcon className="w-4 h-4"/> 刪除標籤
           </button>
           
           <div className="flex space-x-3">
            <button onClick={onClose} className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-100 transition-colors text-xs font-bold uppercase">取消</button>
            <button onClick={handleSave} className="texture-grain px-8 py-3 rounded-full bg-palm-500 text-white hover:bg-palm-600 shadow-lg font-bold text-xs uppercase tracking-widest">儲存變更</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const TagManager: React.FC<{
  title: string;
  tags: TagData[];
  tagType: TagType;
  canEdit: boolean;
  onDelete: (type: TagType, val: string) => void;
  onEdit: (tag: TagData, type: TagType) => void;
}> = ({ title, tags, tagType, canEdit, onDelete, onEdit }) => (
  <div className="glass-card p-6 rounded-2xl border border-white/60 bg-white/40">
    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-pizza-500"></span>
        {title}
    </h3>
    {tags.length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {tags.map(tag => (
          <button 
            key={tag.id} 
            onClick={() => canEdit && onEdit(tag, tagType)}
            className={`group relative inline-flex transition-transform ${canEdit ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
          >
            <Tag color={tag.color} className="px-4 py-1.5 text-xs">{tag.value}</Tag>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-xs text-stone-400 font-serif">無標籤</p>
    )}
  </div>
);

const Pagination: React.FC<{
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}> = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center justify-center space-x-4 mt-8">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-full bg-white text-stone-500 border border-stone-200 hover:bg-stone-50 disabled:opacity-50 text-xs font-bold uppercase">上一頁</button>
            <span className="text-pizza-600 text-xs font-bold uppercase tracking-widest">第 {currentPage} 頁 / 共 {totalPages} 頁</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-full bg-white text-stone-500 border border-stone-200 hover:bg-stone-50 disabled:opacity-50 text-xs font-bold uppercase">下一頁</button>
        </nav>
    );
}

interface TrainingItemsPageProps {
  items: TrainingItem[];
  personnelList: Personnel[];
  workAreaTags: TagData[];
  typeTags: TagData[];
  chapterTags: TagData[];
  jobTitleTags: TagData[];
  userRole: UserRole;
  onAddItem: (item: Omit<TrainingItem, 'id'>) => void;
  onUpdateItem: (item: TrainingItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSelected: (ids: Set<string>) => void;
  onDeleteTag: (type: TagType, val: string) => void;
  onEditTag: (type: TagType, id: string, name: string, color: string, replaceId?: string) => void;
  onImportItems: (data: any[][]) => void;
  onAssignItemsToPersonnel: (itemIds: Set<string>, personnelIds: Set<string>) => void;
}

const TrainingItemsPage: React.FC<TrainingItemsPageProps> = ({ items, personnelList, workAreaTags, typeTags, chapterTags, jobTitleTags, userRole, onAddItem, onUpdateItem, onDeleteItem, onDeleteSelected, onDeleteTag, onEditTag, onImportItems, onAssignItemsToPersonnel }) => {
  
  if (userRole === 'user') {
      return <Navigate to="/" />;
  }

  // State
  const [newItemName, setNewItemName] = useState('');
  const [newItemWorkArea, setNewItemWorkArea] = useState('');
  const [newItemType, setNewItemType] = useState('');
  const [newItemChapter, setNewItemChapter] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({ workArea: 'all', chapter: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set<string>());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemData, setEditedItemData] = useState<Omit<TrainingItem, 'id'>>({ name: '', workArea: '', typeTag: '', chapter: '' });
  const [tagToEdit, setTagToEdit] = useState<{tag: TagData; type: TagType} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canManage = ['admin', 'duty'].includes(userRole);
  
  useEffect(() => {
    const handleResize = () => setItemsPerPage(window.innerWidth < 768 ? 8 : 12);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const existingTags = {
    workArea: new Set(workAreaTags.map(t => t.value)),
    typeTag: new Set(typeTags.map(t => t.value)),
    chapter: new Set(chapterTags.map(t => t.value)),
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const workAreaMatch = filters.workArea === 'all' || item.workArea === filters.workArea;
      const chapterMatch = filters.chapter === 'all' || item.chapter === filters.chapter;
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === '' || 
          item.name.toLowerCase().includes(searchLower) ||
          item.workArea.toLowerCase().includes(searchLower) ||
          item.typeTag.toLowerCase().includes(searchLower) ||
          item.chapter.toLowerCase().includes(searchLower);

      return workAreaMatch && chapterMatch && searchMatch;
    });
  }, [items, filters, searchQuery]);

  const sortedItems = useMemo(() => 
    [...filteredItems].sort((a, b) => {
        const isAUndefined = !existingTags.workArea.has(a.workArea) || !existingTags.typeTag.has(a.typeTag) || !existingTags.chapter.has(a.chapter);
        const isBUndefined = !existingTags.workArea.has(b.workArea) || !existingTags.typeTag.has(b.typeTag) || !existingTags.chapter.has(b.chapter);
        if (isAUndefined && !isBUndefined) return -1;
        if (!isAUndefined && isBUndefined) return 1;
        return a.chapter.localeCompare(b.chapter, undefined, { numeric: true });
    }),
    [filteredItems, existingTags]
  );
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > Math.ceil(sortedItems.length / itemsPerPage) && currentPage > 1) {
        setCurrentPage(1);
    }
  }, [sortedItems.length]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setSelectedItems(new Set()); 
    setCurrentPage(1);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) newSelection.delete(id);
      else newSelection.add(id);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(filteredItems.map(item => item.id)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && newItemWorkArea.trim() && newItemType.trim() && newItemChapter.trim()) {
      onAddItem({ name: newItemName, workArea: newItemWorkArea, typeTag: newItemType, chapter: newItemChapter });
      setNewItemName(''); setNewItemWorkArea(''); setNewItemType(''); setNewItemChapter('');
    }
  };

  const handleStartEdit = (item: TrainingItem) => {
    setEditingItemId(item.id);
    setEditedItemData({ name: item.name, workArea: item.workArea, typeTag: item.typeTag, chapter: item.chapter });
  };
  
  const handleSaveEdit = () => {
    if (!editingItemId) return;
    onUpdateItem({ id: editingItemId, ...editedItemData });
    setEditingItemId(null);
  };

  const allTagsMap = { workArea: workAreaTags, type: typeTags, chapter: chapterTags, job: jobTitleTags };

  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-10 pb-24">
      <Importer 
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={onImportItems}
        title="匯入學習資料"
        columns={['項目名稱', '工作區', '類型', '章節']}
      />
      <AssignToPersonnelModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={(pIds) => { onAssignItemsToPersonnel(selectedItems, pIds); setSelectedItems(new Set()); }}
        personnelList={personnelList}
      />
      
      <EditTagModal 
        isOpen={!!tagToEdit} 
        onClose={() => setTagToEdit(null)} 
        tagToEdit={(tagToEdit && tagToEdit.tag) || null} 
        tagType={(tagToEdit && tagToEdit.type) || 'workArea'} 
        allTags={tagToEdit ? allTagsMap[tagToEdit.type] : []}
        onSave={onEditTag}
        onDelete={onDeleteTag}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
            <h1 className="text-4xl md:text-5xl font-playfair text-left font-bold text-stone-900 mb-2">學習任務</h1>
            <p className="text-stone-500 text-sm font-bold tracking-widest uppercase text-left">課程標準與教材管理</p>
        </div>
        {canManage && (
            <button onClick={() => setIsImporterOpen(true)} className="texture-grain px-6 py-3 rounded-full border border-stone-400 text-stone-600 hover:text-pizza-600 hover:border-pizza-500 hover:bg-white text-xs font-bold uppercase tracking-widest transition-all">
                匯入 Excel
            </button>
        )}
      </div>
      
      {canManage && (
        <div className="glass-panel p-8 rounded-3xl mb-10 border border-white/40">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-6">快速新增項目</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="項目名稱" className="glass-input w-full px-4 py-3 rounded-xl" required />
                </div>
                <div className="md:col-span-2">
                    <input type="text" value={newItemWorkArea} onChange={(e) => setNewItemWorkArea(e.target.value)} placeholder="工作區" list="workarea-list" className="glass-input w-full px-4 py-3 rounded-xl" required />
                    <datalist id="workarea-list">{workAreaTags.map(t => <option key={t.id} value={t.value} />)}</datalist>
                </div>
                <div className="md:col-span-2">
                    <input type="text" value={newItemType} onChange={(e) => setNewItemType(e.target.value)} placeholder="類型" list="type-list" className="glass-input w-full px-4 py-3 rounded-xl" required />
                    <datalist id="type-list">{typeTags.map(t => <option key={t.id} value={t.value} />)}</datalist>
                </div>
                <div className="md:col-span-2">
                    <input type="text" value={newItemChapter} onChange={(e) => setNewItemChapter(e.target.value)} placeholder="章節" list="chapter-list" className="glass-input w-full px-4 py-3 rounded-xl" required />
                    <datalist id="chapter-list">{chapterTags.map(t => <option key={t.id} value={t.value} />)}</datalist>
                </div>
                <div className="md:col-span-2">
                    <button type="submit" className="texture-grain w-full py-3 rounded-xl bg-pizza-500 hover:bg-pizza-600 text-white font-bold shadow-lg transition-all uppercase text-xs tracking-widest">新增</button>
                </div>
            </form>
        </div>
      )}

      <div className="glass-panel p-1 rounded-3xl overflow-hidden shadow-xl border border-white/60 bg-white/80">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between gap-4 bg-white/50">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-pizza-500"></div>
                <span className="text-stone-800 font-bold text-sm">總計: {sortedItems.length} 筆</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <input 
                type="text" 
                placeholder="搜尋..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="glass-input px-4 py-2 rounded-lg text-xs font-bold w-40 sm:w-auto"
              />
              <select name="workArea" value={filters.workArea} onChange={handleFilterChange} className="glass-input px-4 py-2 rounded-lg text-xs border-none uppercase font-bold">
                  <option value="all">全部區域</option>
                  {workAreaTags.map(t => <option key={t.id} value={t.value}>{t.value}</option>)}
              </select>
              <select name="chapter" value={filters.chapter} onChange={handleFilterChange} className="glass-input px-4 py-2 rounded-lg text-xs border-none uppercase font-bold">
                  <option value="all">全部章節</option>
                  {chapterTags.map(t => <option key={t.id} value={t.value}>{t.value}</option>)}
              </select>
            </div>
        </div>

        {selectedItems.size > 0 && canManage && (
            <div className="bg-pizza-100 px-6 py-4 flex justify-between items-center border-b border-pizza-200">
                <span className="text-sm text-pizza-800 font-bold">已選取 {selectedItems.size} 個項目</span>
                <div className="flex gap-3">
                    <button onClick={() => {onDeleteSelected(selectedItems); setSelectedItems(new Set())}} className="texture-grain px-4 py-2 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors uppercase shadow-sm">刪除</button>
                    <button onClick={() => setIsAssignModalOpen(true)} className="texture-grain px-4 py-2 rounded-full bg-white text-stone-800 hover:bg-pizza-500 hover:text-white text-xs font-bold transition-colors uppercase shadow-sm">指派</button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-stone-500 font-bold uppercase tracking-widest border-b border-stone-200 bg-stone-50">
                {canManage && (
                    <th className="px-6 py-5 w-10">
                        <input type="checkbox" className="rounded border-stone-300 text-pizza-500 focus:ring-pizza-500" checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length} onChange={handleSelectAll}/>
                    </th>
                )}
                <th className="px-6 py-5 whitespace-nowrap">項目名稱</th>
                <th className="px-6 py-5 whitespace-nowrap">工作區</th>
                <th className="px-6 py-5 whitespace-nowrap hidden md:table-cell">類型</th>
                <th className="px-6 py-5 whitespace-nowrap">章節</th>
                {canManage && <th className="px-6 py-5 text-right hidden md:table-cell whitespace-nowrap">編輯</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedItems.map((item, index) => {
                const isInvalid = !existingTags.workArea.has(item.workArea) || !existingTags.typeTag.has(item.typeTag) || !existingTags.chapter.has(item.chapter);
                const rowBg = index % 2 === 0 ? 'bg-stone-50/50' : 'bg-white';
                
                return editingItemId === item.id ? (
                    <tr key={item.id} className="bg-pizza-50">
                        <td colSpan={canManage ? 6 : 5} className="px-6 py-4">
                            <div className="flex flex-col md:flex-row gap-2">
                                <input type="text" value={editedItemData.name} onChange={e => setEditedItemData({...editedItemData, name: e.target.value})} className="glass-input flex-1 px-3 py-2 rounded-lg" />
                                <input type="text" value={editedItemData.workArea} onChange={e => setEditedItemData({...editedItemData, workArea: e.target.value})} list="workarea-list" className="glass-input w-full md:w-28 px-3 py-2 rounded-lg" />
                                <input type="text" value={editedItemData.typeTag} onChange={e => setEditedItemData({...editedItemData, typeTag: e.target.value})} list="type-list" className="glass-input w-full md:w-28 px-3 py-2 rounded-lg" />
                                <input type="text" value={editedItemData.chapter} onChange={e => setEditedItemData({...editedItemData, chapter: e.target.value})} list="chapter-list" className="glass-input w-full md:w-24 px-3 py-2 rounded-lg" />
                                <div className="flex gap-2 mt-2 md:mt-0">
                                    <button onClick={handleSaveEdit} className="text-emerald-600 font-bold px-2 uppercase text-xs">儲存</button>
                                    <button onClick={() => setEditingItemId(null)} className="text-stone-500 px-2 uppercase text-xs">取消</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                ) : (
                    <tr key={item.id} className={`${rowBg} hover:bg-pizza-50 transition-colors group ${selectedItems.has(item.id) ? 'bg-pizza-50' : ''} ${isInvalid ? 'bg-red-50' : ''}`}>
                      {canManage && (
                          <td className="px-6 py-4 align-top">
                              <div className="flex flex-col items-center gap-3">
                                <input type="checkbox" className="rounded border-stone-300 text-pizza-500 focus:ring-pizza-500" checked={selectedItems.has(item.id)} onChange={() => handleToggleSelectItem(item.id)}/>
                                
                                <div className="md:hidden flex flex-col gap-3 mt-2">
                                     <button onClick={() => handleStartEdit(item)} className="text-stone-400 hover:text-stone-800">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                     </button>
                                     <button onClick={() => onDeleteItem(item.id)} className="text-stone-400 hover:text-red-500">
                                        <TrashIcon className="w-4 h-4" />
                                     </button>
                                </div>
                              </div>
                          </td>
                      )}
                      <td className="px-6 py-4 align-middle">
                          <Link to={`/training-items/${item.id}`} className="font-bold text-stone-800 hover:text-pizza-600 text-base whitespace-nowrap border-b border-transparent hover:border-pizza-600 transition-all">
                              {item.name}
                          </Link>
                      </td>
                      <td className="px-6 py-4 align-middle"><Tag color={(workAreaTags.find(t=>t.value===item.workArea) || {}).color || 'red'}>{item.workArea}</Tag></td>
                      <td className="px-6 py-4 hidden md:table-cell align-middle"><Tag color={(typeTags.find(t=>t.value===item.typeTag) || {}).color || 'red'}>{item.typeTag}</Tag></td>
                      <td className="px-6 py-4 align-middle"><Tag color={(chapterTags.find(t=>t.value===item.chapter) || {}).color || 'red'}>{item.chapter}</Tag></td>
                      
                      {canManage && (
                          <td className="px-6 py-4 text-right space-x-3 hidden md:table-cell align-middle">
                            <button onClick={() => handleStartEdit(item)} className="text-stone-400 hover:text-stone-800 font-bold text-xs uppercase">編輯</button>
                            <button onClick={() => onDeleteItem(item.id)} className="text-stone-400 hover:text-red-500"><TrashIcon className="w-4 h-4 inline" /></button>
                          </td>
                      )}
                    </tr>
                )
              })}
            </tbody>
          </table>
          {sortedItems.length === 0 && <div className="p-10 text-center text-stone-400 font-serif">無學習項目</div>}
        </div>
        <div className="bg-white/50 p-4 border-t border-stone-200">
             <Pagination totalItems={sortedItems.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-lg font-playfair text-stone-700 mb-8">系統標籤管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TagManager title="工作區域" tags={workAreaTags} tagType="workArea" canEdit={canManage} onDelete={onDeleteTag} onEdit={(tag, type) => setTagToEdit({tag, type})} />
            <TagManager title="項目類型" tags={typeTags} tagType="type" canEdit={canManage} onDelete={onDeleteTag} onEdit={(tag, type) => setTagToEdit({tag, type})} />
            <TagManager title="章節" tags={chapterTags} tagType="chapter" canEdit={canManage} onDelete={onDeleteTag} onEdit={(tag, type) => setTagToEdit({tag, type})} />
            <TagManager title="職位" tags={jobTitleTags} tagType="job" canEdit={canManage} onDelete={onDeleteTag} onEdit={(tag, type) => setTagToEdit({tag, type})} />
        </div>
      </div>
    </div>
  );
};

export default TrainingItemsPage;
