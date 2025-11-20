
import React, { useState, useMemo, useEffect } from 'react';
import { type TrainingItem, type TagData, type TagColor, type Personnel, type UserRole } from '../types';
import { TrashIcon } from '../components/icons/TrashIcon';
import Tag from '../components/Tag';
import Importer from '../components/Importer';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

// Assign to Personnel Modal
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
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPersonnel.size === activePersonnel.length) {
      setSelectedPersonnel(new Set());
    } else {
      setSelectedPersonnel(new Set(activePersonnel.map(p => p.id)));
    }
  };

  const handleConfirm = () => {
    onAssign(selectedPersonnel);
    onClose();
    setSelectedPersonnel(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">指派任務給人員</h3>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center p-2 border-b">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={selectedPersonnel.size === activePersonnel.length && activePersonnel.length > 0}
              onChange={handleSelectAll}
            />
            <label className="ml-3 text-sm font-medium">全選/取消全選</label>
          </div>
          <ul className="divide-y divide-slate-200">
            {activePersonnel.map(person => (
              <li key={person.id} className="py-3 flex items-center">
                <input
                  type="checkbox"
                  id={`person-${person.id}`}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={selectedPersonnel.has(person.id)}
                  onChange={() => handleToggle(person.id)}
                />
                <label htmlFor={`person-${person.id}`} className="ml-3 text-sm font-medium">{person.name} <span className="text-xs text-slate-500">({person.jobTitle})</span></label>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button onClick={handleConfirm} className="btn-primary" disabled={selectedPersonnel.size === 0}>確認發布</button>
        </div>
      </div>
    </div>
  );
};

// Edit Tag Modal Component
const EditTagModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tagToEdit: TagData | null;
  tagType: TagType;
  allTags: TagData[];
  onSave: (
    tagType: TagType,
    tagId: string,
    newName: string,
    newColor: TagColor,
    replacementTagId?: string
  ) => void;
}> = ({ isOpen, onClose, tagToEdit, tagType, allTags, onSave }) => {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<TagColor>('slate');
  const [replacementTag, setReplacementTag] = useState('');

  useEffect(() => {
    if (tagToEdit) {
      setTagName(tagToEdit.value);
      setTagColor(tagToEdit.color);
      setReplacementTag('');
    }
  }, [tagToEdit]);

  if (!isOpen || !tagToEdit) return null;

  const availableColors: TagColor[] = ['slate', 'sky', 'green', 'amber', 'red', 'indigo', 'pink', 'purple'];
  const replacementOptions = allTags.filter(t => t.id !== tagToEdit.id);

  const handleSave = () => {
    onSave(tagType, tagToEdit.id, tagName, tagColor, replacementTag);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">編輯標籤: {tagToEdit.value}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">標籤名稱</label>
            <input type="text" value={tagName} onChange={e => setTagName(e.target.value)} className="input-style"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">標籤顏色</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableColors.map(color => (
                <button key={color} onClick={() => setTagColor(color)} className={`h-8 w-8 rounded-full border-2 ${tagColor === color ? 'border-sky-500 ring-2 ring-sky-200' : 'border-transparent'}`}>
                   <Tag color={color} className="w-full h-full block rounded-full">&nbsp;</Tag>
                </button>
              ))}
            </div>
          </div>
          {replacementOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">替代並刪除此標籤 (可選)</label>
              <p className="text-xs text-slate-500 mb-1">選擇一個標籤來取代所有 "{tagToEdit.value}"。此操作將會刪除原標籤。</p>
              <select value={replacementTag} onChange={e => setReplacementTag(e.target.value)} className="input-style">
                <option value="">不替代</option>
                {replacementOptions.map(t => <option key={t.id} value={t.id}>{t.value}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button onClick={handleSave} className="btn-primary">儲存變更</button>
        </div>
      </div>
    </div>
  );
};


// Tag Manager Component
const TagManager: React.FC<{
  title: string;
  tags: TagData[];
  tagType: TagType;
  canEdit: boolean;
  onDelete: (tagType: TagType, tagValue: string) => void;
  onEdit: (tag: TagData, tagType: TagType) => void;
}> = ({ title, tags, tagType, canEdit, onDelete, onEdit }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    {tags.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag.id} className="flex items-center text-sm font-medium pl-3 pr-2 py-1 rounded-full group" style={{ backgroundColor: `var(--color-${tag.color}-bg)`, color: `var(--color-${tag.color}-text)` }}>
            {tag.value}
            {canEdit && (
                <>
                    <button onClick={() => onEdit(tag, tagType)} className="ml-2 text-current opacity-50 hover:opacity-100 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    </button>
                    <button onClick={() => onDelete(tagType, tag.value)} className="ml-1 text-current opacity-50 hover:opacity-100 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </>
            )}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">尚無標籤</p>
    )}
  </div>
);


// Pagination Component
const Pagination: React.FC<{
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}> = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    
    return (
        <nav className="flex items-center justify-center space-x-2 mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-slate-300 text-slate-600 disabled:opacity-50">上一頁</button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded-md text-sm font-medium border ${currentPage === number ? 'bg-sky-500 text-white border-sky-500' : 'bg-white border-slate-300 text-slate-600'}`}>{number}</button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-slate-300 text-slate-600 disabled:opacity-50">下一頁</button>
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
  onDeleteTag: (tagType: TagType, value: string) => void;
  onEditTag: (tagType: TagType, tagId: string, newName: string, newColor: TagColor, replacementTagId?: string) => void;
  onImportItems: (data: any[][]) => void;
  onAssignItemsToPersonnel: (itemIds: Set<string>, personnelIds: Set<string>) => void;
}

const TrainingItemsPage: React.FC<TrainingItemsPageProps> = ({ items, personnelList, workAreaTags, typeTags, chapterTags, jobTitleTags, userRole, onAddItem, onUpdateItem, onDeleteItem, onDeleteSelected, onDeleteTag, onEditTag, onImportItems, onAssignItemsToPersonnel }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemWorkArea, setNewItemWorkArea] = useState('');
  const [newItemType, setNewItemType] = useState('');
  const [newItemChapter, setNewItemChapter] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({ workArea: 'all', chapter: 'all' });
  const [selectedItems, setSelectedItems] = useState(new Set<string>());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemData, setEditedItemData] = useState<Omit<TrainingItem, 'id'>>({ name: '', workArea: '', typeTag: '', chapter: '' });

  const [tagToEdit, setTagToEdit] = useState<{tag: TagData; type: TagType} | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canManage = ['admin', 'duty'].includes(userRole);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
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
      return workAreaMatch && chapterMatch;
    });
  }, [items, filters]);

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
    if (currentPage > Math.ceil(sortedItems.length / itemsPerPage)) {
        setCurrentPage(1);
    }
  }, [sortedItems.length, itemsPerPage, currentPage]);

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
      setNewItemName('');
      setNewItemWorkArea('');
      setNewItemType('');
      setNewItemChapter('');
    }
  };

  const handleStartEdit = (item: TrainingItem) => {
    setEditingItemId(item.id);
    setEditedItemData({ name: item.name, workArea: item.workArea, typeTag: item.typeTag, chapter: item.chapter });
  };
  
  const handleCancelEdit = () => setEditingItemId(null);
  
  const handleSaveEdit = () => {
    if (!editingItemId) return;
    onUpdateItem({ id: editingItemId, ...editedItemData });
    setEditingItemId(null);
  };

  const handleOpenEditTagModal = (tag: TagData, type: TagType) => {
    setTagToEdit({ tag, type });
  };

  const handleAssignConfirm = (personnelIds: Set<string>) => {
    onAssignItemsToPersonnel(selectedItems, personnelIds);
    setSelectedItems(new Set());
  };

  const allTagsMap = {
    workArea: workAreaTags,
    type: typeTags,
    chapter: chapterTags,
    job: jobTitleTags
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Importer 
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={onImportItems}
        title="從試算表匯入學習項目"
        columns={['項目名稱', '工作區', '類型', '章節']}
      />
      <AssignToPersonnelModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignConfirm}
        personnelList={personnelList}
      />
      <EditTagModal
        isOpen={!!tagToEdit}
        onClose={() => setTagToEdit(null)}
        tagToEdit={tagToEdit?.tag || null}
        tagType={tagToEdit?.type || 'workArea'}
        allTags={tagToEdit ? allTagsMap[tagToEdit.type] : []}
        onSave={onEditTag}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">學習項目管理</h1>
        {canManage && (
            <button 
            onClick={() => setIsImporterOpen(true)}
            className="btn-primary"
            >
            從試算表匯入
            </button>
        )}
      </div>
      
      {canManage && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">新增學習項目</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="label-style">項目名稱</label>
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="例如：製作拿鐵" className="input-style" required />
                </div>
                <div>
                    <label className="label-style">工作區</label>
                    <input type="text" value={newItemWorkArea} onChange={(e) => setNewItemWorkArea(e.target.value)} placeholder="例如：吧台" list="workarea-tags-list" className="input-style" required />
                    <datalist id="workarea-tags-list">
                        {workAreaTags.map(tag => <option key={tag.id} value={tag.value} />)}
                    </datalist>
                </div>
                <div>
                    <label className="label-style">類型</label>
                    <input type="text" value={newItemType} onChange={(e) => setNewItemType(e.target.value)} placeholder="例如：設備操作" list="type-tags-list" className="input-style" required />
                    <datalist id="type-tags-list">
                        {typeTags.map(tag => <option key={tag.id} value={tag.value} />)}
                    </datalist>
                </div>
                <div>
                    <label className="label-style">章節</label>
                    <input type="text" value={newItemChapter} onChange={(e) => setNewItemChapter(e.target.value)} placeholder="例如：CH1" list="chapter-tags-list" className="input-style" required />
                    <datalist id="chapter-tags-list">
                        {chapterTags.map(tag => <option key={tag.id} value={tag.value} />)}
                    </datalist>
                </div>
                <button type="submit" className="justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                新增項目
                </button>
            </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold">現有學習項目 ({sortedItems.length})</h2>
            <div className="flex items-center gap-4">
              <select name="workArea" value={filters.workArea} onChange={handleFilterChange} className="input-style text-sm py-1.5">
                  <option value="all">所有工作區</option>
                  {workAreaTags.map(tag => <option key={tag.id} value={tag.value}>{tag.value}</option>)}
              </select>
              <select name="chapter" value={filters.chapter} onChange={handleFilterChange} className="input-style text-sm py-1.5">
                  <option value="all">所有章節</option>
                  {chapterTags.map(tag => <option key={tag.id} value={tag.value}>{tag.value}</option>)}
              </select>
            </div>
        </div>
        {selectedItems.size > 0 && canManage && (
            <div className="bg-sky-50 border border-sky-200 rounded-md p-3 mb-4 flex justify-between items-center">
                <span className="text-sm font-medium text-sky-800">已選取 {selectedItems.size} / {filteredItems.length} 個項目</span>
                <div className="flex space-x-2">
                    <button onClick={() => {onDeleteSelected(selectedItems); setSelectedItems(new Set())}} className="text-sm bg-red-500 text-white hover:bg-red-600 font-semibold py-1 px-3 rounded-md">
                        刪除
                    </button>
                    <button onClick={() => setIsAssignModalOpen(true)} className="text-sm bg-indigo-500 text-white hover:bg-indigo-600 font-semibold py-1 px-3 rounded-md">
                        指派任務給人員
                    </button>
                </div>
            </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {canManage && (
                    <th className="px-4 py-3 text-left"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length} onChange={handleSelectAll}/></th>
                )}
                <th className="th-style">項目名稱</th>
                <th className="th-style">工作區</th>
                <th className="th-style">類型</th>
                <th className="th-style">章節</th>
                {canManage && <th className="relative px-6 py-3 text-right th-style">操作</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {paginatedItems.map(item => {
                const isUndefined = !existingTags.workArea.has(item.workArea) || !existingTags.typeTag.has(item.typeTag) || !existingTags.chapter.has(item.chapter);
                return editingItemId === item.id ? (
                    <tr key={item.id} className="bg-sky-50">
                        <td className="px-4 py-4"></td>
                        <td className="px-6 py-4"><input type="text" value={editedItemData.name} onChange={e => setEditedItemData({...editedItemData, name: e.target.value})} className="input-style" /></td>
                        <td className="px-6 py-4"><input type="text" value={editedItemData.workArea} onChange={e => setEditedItemData({...editedItemData, workArea: e.target.value})} list="workarea-tags-list" className="input-style" /></td>
                        <td className="px-6 py-4"><input type="text" value={editedItemData.typeTag} onChange={e => setEditedItemData({...editedItemData, typeTag: e.target.value})} list="type-tags-list" className="input-style" /></td>
                        <td className="px-6 py-4"><input type="text" value={editedItemData.chapter} onChange={e => setEditedItemData({...editedItemData, chapter: e.target.value})} list="chapter-tags-list" className="input-style" /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                           <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900">儲存</button>
                           <button onClick={handleCancelEdit} className="text-slate-600 hover:text-slate-900">取消</button>
                        </td>
                    </tr>
                ) : (
                    <tr key={item.id} className={`${selectedItems.has(item.id) ? 'bg-sky-50' : ''} ${isUndefined ? 'bg-red-50' : ''}`}>
                      {canManage && (
                          <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" checked={selectedItems.has(item.id)} onChange={() => handleToggleSelectItem(item.id)}/></td>
                      )}
                      <td className="td-style font-medium text-slate-900">{item.name}</td>
                      <td className="td-style"><Tag color={workAreaTags.find(t=>t.value===item.workArea)?.color || 'red'}>{item.workArea}</Tag></td>
                      <td className="td-style"><Tag color={typeTags.find(t=>t.value===item.typeTag)?.color || 'red'}>{item.typeTag}</Tag></td>
                      <td className="td-style"><Tag color={chapterTags.find(t=>t.value===item.chapter)?.color || 'red'}>{item.chapter}</Tag></td>
                      {canManage && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                            <button onClick={() => handleStartEdit(item)} className="text-sky-600 hover:text-sky-900">編輯</button>
                            <button onClick={() => onDeleteItem(item.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5 inline" /></button>
                          </td>
                      )}
                    </tr>
                )
              })}
            </tbody>
          </table>
          {sortedItems.length === 0 && (
            <p className="text-center text-slate-500 py-8">無符合篩選條件的項目</p>
          )}
        </div>
        <Pagination totalItems={sortedItems.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">標籤管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <TagManager title="工作區標籤" tags={workAreaTags} tagType="workArea" canEdit={canManage} onDelete={onDeleteTag} onEdit={handleOpenEditTagModal} />
            <TagManager title="類型標籤" tags={typeTags} tagType="type" canEdit={canManage} onDelete={onDeleteTag} onEdit={handleOpenEditTagModal} />
            <TagManager title="章節標籤" tags={chapterTags} tagType="chapter" canEdit={canManage} onDelete={onDeleteTag} onEdit={handleOpenEditTagModal} />
            <TagManager title="職等標籤" tags={jobTitleTags} tagType="job" canEdit={canManage} onDelete={onDeleteTag} onEdit={handleOpenEditTagModal} />
        </div>
      </div>

      <style>{`
        .input-style { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); } 
        .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 2px #7dd3fc; }
        .label-style { display: block; text-sm; font-medium; color: #475569; }
        .th-style { padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .td-style { padding: 1rem 1.5rem; white-space: nowrap; font-size: 0.875rem; line-height: 1.25rem; color: #64748b; }
        .btn-primary { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: white; background-color: #0ea5e9; } .btn-primary:hover { background-color: #0284c7; } .btn-primary:disabled { background-color: #7dd3fc; cursor: not-allowed; }
        .btn-secondary { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #334155; background-color: white; } .btn-secondary:hover { background-color: #f1f5f9; }
        :root {
            --color-slate-bg: #f1f5f9; --color-slate-text: #475569;
            --color-sky-bg: #e0f2fe; --color-sky-text: #0369a1;
            --color-green-bg: #dcfce7; --color-green-text: #15803d;
            --color-amber-bg: #fef3c7; --color-amber-text: #b45309;
            --color-red-bg: #fee2e2; --color-red-text: #b91c1c;
            --color-indigo-bg: #e0e7ff; --color-indigo-text: #4338ca;
            --color-pink-bg: #fce7f3; --color-pink-text: #be185d;
            --color-purple-bg: #f3e8ff; --color-purple-text: #7e22ce;
        }
      `}</style>
    </div>
  );
};

export default TrainingItemsPage;
