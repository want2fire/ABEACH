import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData } from '../types';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import { TrashIcon } from '../components/icons/TrashIcon';
import Importer from '../components/Importer';

// Helper function to calculate age
const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
};

// Helper function to calculate progress
const calculateProgress = (person: Personnel): number => {
    if (person.trainingPlan.length === 0) return 100;
    const completedCount = person.trainingPlan.filter(p => p.completed).length;
    return (completedCount / person.trainingPlan.length) * 100;
};

// Helper function to get next item
const getNextItemToLearn = (person: Personnel, trainingItems: TrainingItem[]): string => {
    const uncompletedItems = person.trainingPlan
      .filter(p => !p.completed)
      .map(p => trainingItems.find(item => item.id === p.itemId))
      .filter((item): item is TrainingItem => item !== undefined)
      .sort((a, b) => a.chapter.localeCompare(b.chapter, undefined, {numeric: true}) || a.section.localeCompare(b.section, undefined, { numeric: true }));

    return uncompletedItems.length > 0 ? uncompletedItems[0].name : '已全部完成';
};


// Card component for displaying and editing personnel
const PersonnelCard: React.FC<{
    person: Personnel;
    trainingItems: TrainingItem[];
    jobTitleTags: TagData[];
    onUpdate: (person: Personnel) => void;
    onDelete: (id: string) => void;
}> = ({ person, trainingItems, jobTitleTags, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPerson, setEditedPerson] = useState(person);

    useEffect(() => {
        setEditedPerson(person);
    }, [person]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedPerson(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onUpdate(editedPerson);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedPerson(person);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-sky-500 animate-pulse-once">
                <style>{`.animate-pulse-once { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1); } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .8; } }`}</style>
                <div className="space-y-4">
                    <input type="text" name="name" value={editedPerson.name} onChange={handleInputChange} placeholder="姓名" className="input-style w-full font-bold text-slate-900" />
                    <div className="relative">
                      <select name="status" value={editedPerson.status} onChange={handleInputChange} className="input-style w-full appearance-none pr-10">
                          <option value="在職">在職</option>
                          <option value="支援">支援</option>
                          <option value="離職">離職</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    <div>
                        <input type="text" name="jobTitle" value={editedPerson.jobTitle} onChange={handleInputChange} placeholder="職等" className="input-style w-full" list="job-titles-list" />
                        <datalist id="job-titles-list">
                            {jobTitleTags.map(tag => <option key={tag.id} value={tag.value} />)}
                        </datalist>
                    </div>
                    <input type="date" name="dob" value={editedPerson.dob} onChange={handleInputChange} className="input-style w-full" />
                    <input type="tel" name="phone" value={editedPerson.phone} onChange={handleInputChange} placeholder="電話" className="input-style w-full" />
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCancel} className="btn-secondary">取消</button>
                        <button onClick={handleSave} className="btn-primary">儲存</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 relative group">
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-sky-600" aria-label={`Edit ${person.name}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => onDelete(person.id)} className="p-1 text-slate-500 hover:text-red-600" aria-label={`Delete ${person.name}`}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="relative inline-block name-button-container self-start group">
                <Link to={`/personnel/${person.id}`} className="inline-block bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors duration-200 font-bold py-1 px-4 rounded-lg text-xl" aria-label={`View details for ${person.name}`}>
                  {person.name}
                </Link>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    點擊查看詳細進度
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 mb-4">
                <Tag color={jobTitleTags.find(t=>t.value===person.jobTitle)?.color || 'red'}>{person.jobTitle}</Tag>
                <Tag color={person.gender === '男性' ? 'indigo' : person.gender === '女性' ? 'pink' : 'purple'}>{person.gender}</Tag>
                <Tag color="amber">{calculateAge(person.dob)} 歲</Tag>
                <Tag color="green">{person.phone}</Tag>
            </div>
            
            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">下一項學習</p>
                    <p className="text-sm text-slate-800 truncate">{getNextItemToLearn(person, trainingItems)}</p>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-slate-500">學習進度</p>
                        <p className="text-sm font-medium text-sky-600">{Math.round(calculateProgress(person))}%</p>
                    </div>
                    <ProgressBar progress={calculateProgress(person)} />
                </div>
            </div>
            <style>{`.name-button-container:hover .opacity-0 { opacity: 1; }`}</style>
        </div>
    );
};


interface PersonnelListPageProps {
  personnelList: Personnel[];
  trainingItems: TrainingItem[];
  jobTitleTags: TagData[];
  onAddPersonnel: (person: Omit<Personnel, 'id' | 'trainingPlan' | 'status' | 'schedule'>) => void;
  onUpdatePersonnel: (person: Personnel) => void;
  onDeletePersonnel: (id: string) => void;
  onImportPersonnel: (data: string) => void;
}

const PersonnelListPage: React.FC<PersonnelListPageProps> = ({ personnelList, trainingItems, jobTitleTags, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onImportPersonnel }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'男性' | '女性' | '其他'>('男性');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newDob && newPhone.trim() && newJobTitle.trim()) {
      onAddPersonnel({ name: newName, gender: newGender, dob: newDob, phone: newPhone, jobTitle: newJobTitle });
      setNewName('');
      setNewGender('男性');
      setNewDob('');
      setNewPhone('');
      setNewJobTitle('');
      setIsFormVisible(false);
    }
  };
  
  const activePersonnel = personnelList.filter(p => p.status === '在職');
  const supportPersonnel = personnelList.filter(p => p.status === '支援');
  const resignedPersonnel = personnelList.filter(p => p.status === '離職');

  const renderPersonnelSection = (title: string, personnel: Personnel[], bgColorClass: string = '') => {
    const sortedPersonnel = [...personnel].sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <div className={`mt-8 ${bgColorClass} p-4 sm:p-6 rounded-lg`}>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{title} ({personnel.length})</h2>
            {sortedPersonnel.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPersonnel.map(person => (
                        <PersonnelCard 
                            key={person.id} 
                            person={person} 
                            trainingItems={trainingItems}
                            jobTitleTags={jobTitleTags}
                            onUpdate={onUpdatePersonnel}
                            onDelete={onDeletePersonnel}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-slate-500">此區無人員資料</p>
            )}
        </div>
      );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Importer
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={onImportPersonnel}
        title="從試算表匯入人員資料"
        columns={['姓名', '性別', '出生年月日 (YYYY-MM-DD)', '電話', '職等']}
      />
      <style>{`
        .input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .btn-primary { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: white; background-color: #0ea5e9; } .btn-primary:hover { background-color: #0284c7; }
        .btn-secondary { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #334155; background-color: white; } .btn-secondary:hover { background-color: #f1f5f9; }
      `}</style>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">人員名單</h1>
        <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsImporterOpen(true)}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              匯入資料
            </button>
            <button 
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              {isFormVisible ? '取消新增' : '新增人員'}
            </button>
        </div>
      </div>
      
      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">新增人員資料</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="姓名" required className="input-style" />
            <select value={newGender} onChange={e => setNewGender(e.target.value as any)} required className="input-style">
              <option>男性</option>
              <option>女性</option>
              <option>其他</option>
            </select>
            <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} required className="input-style" />
            <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="電話" required className="input-style" />
            <div className="md:col-span-2">
                <input type="text" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} placeholder="職等 (例如: 正職)" required className="input-style" list="job-titles-list-add" />
                <datalist id="job-titles-list-add">
                    {jobTitleTags.map(tag => <option key={tag.id} value={tag.value} />)}
                </datalist>
            </div>
            <button type="submit" className="md:col-span-2 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">確認新增</button>
          </form>
        </div>
      )}

      {renderPersonnelSection('在職人員', activePersonnel)}
      {renderPersonnelSection('支援人員', supportPersonnel, 'bg-sky-50')}
      {renderPersonnelSection('離職人員', resignedPersonnel, 'bg-slate-200')}

    </div>
  );
};

export default PersonnelListPage;