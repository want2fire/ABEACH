import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TrainingAssignment, type TagData } from '../types';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';

interface PersonnelDetailPageProps {
  personnelList: Personnel[];
  trainingItems: TrainingItem[];
  jobTitleTags: TagData[];
  onUpdatePersonnel: (updatedPersonnel: Personnel) => void;
}

const AddItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    allItems: TrainingItem[];
    assignedItemIds: string[];
    onAddItem: (itemId: string) => void;
}> = ({ isOpen, onClose, allItems, assignedItemIds, onAddItem }) => {
    if (!isOpen) return null;

    const availableItems = allItems
        .filter(item => !assignedItemIds.includes(item.id))
        .sort((a,b) => a.chapter.localeCompare(b.chapter, undefined, {numeric: true}) || a.section.localeCompare(b.section, undefined, { numeric: true }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">新增學習項目</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {availableItems.length > 0 ? (
                         <ul className="divide-y divide-slate-200">
                         {availableItems.map(item => (
                             <li key={item.id} className="py-3 flex justify-between items-center">
                                 <div>
                                     <p className="font-medium">{item.name}</p>
                                     <p className="text-sm text-slate-500">{item.chapter} - {item.section} - {item.workArea} / {item.typeTag}</p>
                                 </div>
                                 <button onClick={() => onAddItem(item.id)} className="text-sm text-white bg-sky-500 hover:bg-sky-600 px-3 py-1 rounded-md">新增</button>
                             </li>
                         ))}
                     </ul>
                    ) : (
                        <p className="text-center text-slate-500 py-4">所有項目都已指派</p>
                    )}
                </div>
                <div className="p-4 border-t text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">關閉</button>
                </div>
            </div>
        </div>
    );
};


const PersonnelDetailPage: React.FC<PersonnelDetailPageProps> = ({ personnelList, trainingItems, jobTitleTags, onUpdatePersonnel }) => {
  const { personnelId } = useParams<{ personnelId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const person = personnelList.find(p => p.id === personnelId);
  const [editedPerson, setEditedPerson] = useState(person);

  useEffect(() => {
    setEditedPerson(person);
  }, [person]);

  if (!person) {
    return <Navigate to="/" />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedPerson) return;
    const { name, value } = e.target;
    setEditedPerson({ ...editedPerson, [name]: value });
  };
  
  const handleSave = () => {
    if (editedPerson) {
        onUpdatePersonnel(editedPerson);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPerson(person);
    setIsEditing(false);
  };


  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const calculateProgress = () => {
    if (person.trainingPlan.length === 0) return 100;
    const completedCount = person.trainingPlan.filter(p => p.completed).length;
    return (completedCount / person.trainingPlan.length) * 100;
  };

  const handleToggleComplete = (itemId: string, isCompleted: boolean) => {
    const updatedPlan = person.trainingPlan.map(item => 
      item.itemId === itemId ? { ...item, completed: isCompleted } : item
    );
    onUpdatePersonnel({ ...person, trainingPlan: updatedPlan });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedPlan = person.trainingPlan.filter(item => item.itemId !== itemId);
    onUpdatePersonnel({ ...person, trainingPlan: updatedPlan });
  };

  const handleAddItem = (itemId: string) => {
    const newItem: TrainingAssignment = { itemId, completed: false };
    const updatedPlan = [...person.trainingPlan, newItem];
    onUpdatePersonnel({ ...person, trainingPlan: updatedPlan });
  };


  const getItemDetails = (itemId: string) => trainingItems.find(item => item.id === itemId);

  const todoItems = person.trainingPlan
    .filter(p => !p.completed)
    .map(p => ({ ...p, details: getItemDetails(p.itemId) }))
    .filter(p => p.details)
    .sort((a, b) => a.details!.chapter.localeCompare(b.details!.chapter, undefined, {numeric: true}) || a.details!.section.localeCompare(b.details!.section, undefined, { numeric: true }));
  
  const completedItems = person.trainingPlan
    .filter(p => p.completed)
    .map(p => ({ ...p, details: getItemDetails(p.itemId) }))
    .filter(p => p.details)
    .sort((a, b) => a.details!.chapter.localeCompare(b.details!.chapter, undefined, {numeric: true}) || a.details!.section.localeCompare(b.details!.section, undefined, { numeric: true }));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }`}</style>
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        allItems={trainingItems}
        assignedItemIds={person.trainingPlan.map(p => p.itemId)}
        onAddItem={handleAddItem}
      />
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex justify-between items-start">
            {isEditing && editedPerson ? (
                 <input type="text" name="name" value={editedPerson.name} onChange={handleInputChange} className="input-style text-3xl font-bold w-full mb-3" />
            ) : (
                <h1 className="text-3xl font-bold text-slate-900">{person.name}</h1>
            )}

            {!isEditing ? (
                 <button onClick={() => setIsEditing(true)} className="text-sm text-white bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-md">編輯</button>
            ): (
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md">儲存</button>
                    <button onClick={handleCancel} className="text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-md">取消</button>
                </div>
            )}
           
        </div>
        {isEditing && editedPerson ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                 <div>
                    <label className="text-xs text-slate-500">職等</label>
                    <input type="text" name="jobTitle" value={editedPerson.jobTitle} onChange={handleInputChange} className="input-style" list="job-titles-list" />
                    <datalist id="job-titles-list">
                        {jobTitleTags.map(tag => <option key={tag.id} value={tag.value} />)}
                    </datalist>
                </div>
                <div>
                    <label className="text-xs text-slate-500">性別</label>
                    <select name="gender" value={editedPerson.gender} onChange={handleInputChange} className="input-style">
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500">出生年月日</label>
                    <input type="date" name="dob" value={editedPerson.dob} onChange={handleInputChange} className="input-style" />
                </div>
                <div>
                    <label className="text-xs text-slate-500">電話</label>
                    <input type="tel" name="phone" value={editedPerson.phone} onChange={handleInputChange} className="input-style" />
                </div>
            </div>
        ) : (
            <div className="flex flex-wrap gap-2 mt-3">
                <Tag color={jobTitleTags.find(t=>t.value === person.jobTitle)?.color || 'sky'}>{person.jobTitle}</Tag>
                <Tag color={person.gender === '男性' ? 'indigo' : person.gender === '女性' ? 'pink' : 'purple'}>{person.gender}</Tag>
                <Tag color="amber">{calculateAge(person.dob)} 歲</Tag>
                <Tag color="green">{person.phone}</Tag>
            </div>
        )}
        <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-slate-500">學習總進度</p>
              <p className="text-sm font-medium text-sky-600">{Math.round(calculateProgress())}%</p>
            </div>
            <ProgressBar progress={calculateProgress()} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* To-Do List */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">待學習項目 ({todoItems.length})</h2>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-sm text-white bg-sky-500 hover:bg-sky-600 px-3 py-2 rounded-md transition-colors">
              <PlusIcon className="w-4 h-4" />
              新增
            </button>
          </div>
          <ul className="space-y-3">
            {todoItems.map(({ itemId, details }) => (
              <li key={itemId} className="flex items-center p-3 bg-slate-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleToggleComplete(itemId, true)}
                  className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="ml-4 flex-grow">
                  <p className="font-medium text-slate-800">{details!.name}</p>
                  <p className="text-sm text-slate-500">{details!.chapter}-{details!.section} - {details!.workArea} / {details!.typeTag}</p>
                </div>
                <button onClick={() => handleRemoveItem(itemId)} className="ml-4 text-slate-400 hover:text-red-600">
                  <TrashIcon className="w-5 h-5"/>
                </button>
              </li>
            ))}
            {todoItems.length === 0 && <p className="text-center text-slate-500 py-4">沒有待學習的項目</p>}
          </ul>
        </div>
        
        {/* Completed List */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">已完成項目 ({completedItems.length})</h2>
          <ul className="space-y-3">
             {completedItems.map(({ itemId, details }) => (
              <li key={itemId} className="flex items-center p-3 bg-green-50 rounded-md text-slate-500">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => handleToggleComplete(itemId, false)}
                  className="h-5 w-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <div className="ml-4 flex-grow">
                  <p className="font-medium line-through">{details!.name}</p>
                  <p className="text-sm line-through">{details!.chapter}-{details!.section} - {details!.workArea} / {details!.typeTag}</p>
                </div>
              </li>
            ))}
             {completedItems.length === 0 && <p className="text-center text-slate-500 py-4">尚未完成任何項目</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetailPage;