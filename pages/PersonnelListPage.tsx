
import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type UserRole } from '../types';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import { TrashIcon } from '../components/icons/TrashIcon';
import Importer from '../components/Importer';

const calculateProgress = (person: Personnel): number => {
    if (person.trainingPlan.length === 0) return 100;
    const completedCount = person.trainingPlan.filter(p => p.completed).length;
    return (completedCount / person.trainingPlan.length) * 100;
};

const getNextItemToLearn = (person: Personnel, trainingItems: TrainingItem[]): string => {
    const uncompletedItems = person.trainingPlan
      .filter(p => !p.completed)
      .map(p => trainingItems.find(item => item.id === p.itemId))
      .filter((item): item is TrainingItem => item !== undefined)
      .sort((a, b) => a.chapter.localeCompare(b.chapter, undefined, {numeric: true}) || a.name.localeCompare(b.name));

    return uncompletedItems.length > 0 ? uncompletedItems[0].name : '全數完成';
};

const getJobTitleColor = (title: string): string => {
    switch(title) {
        case '外場DUTY': return '#552583'; // Lakers Purple
        case '內場DUTY': return '#005A9C'; // Dodgers Blue
        case 'A TEAM': return '#FFD700'; // Gold
        case '管理員': return '#EF4444'; // Red-500
        case '一般員工': return '#10B981'; // Emerald-500
        default: return 'slate';
    }
};

const PersonnelCard: React.FC<{
    person: Personnel;
    trainingItems: TrainingItem[];
    jobTitleTags: TagData[];
    userRole: UserRole;
    onUpdate: (person: Personnel) => void;
    onDelete: (id: string) => void;
}> = ({ person, trainingItems, jobTitleTags, userRole, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPerson, setEditedPerson] = useState(person);

    const canEdit = ['admin', 'duty'].includes(userRole);

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
            <div className="glass-panel p-6 rounded-3xl border border-pizza-200 shadow-lg">
                <div className="space-y-4">
                    <input type="text" name="name" value={editedPerson.name} onChange={handleInputChange} placeholder="姓名" className="glass-input w-full font-bold px-3 py-2 rounded-lg" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-stone-500 font-bold">狀態</label>
                            <select name="status" value={editedPerson.status} onChange={handleInputChange} className="glass-input w-full px-3 py-2 rounded-lg">
                                <option value="在職">在職</option>
                                <option value="支援">支援</option>
                                <option value="離職">離職</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                             <label className="text-[10px] uppercase text-stone-500 font-bold">登入碼</label>
                             <input type="text" name="access_code" value={editedPerson.access_code} onChange={handleInputChange} className="glass-input w-full px-3 py-2 rounded-lg" maxLength={4} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-500 font-bold">職位</label>
                        <select name="jobTitle" value={editedPerson.jobTitle} onChange={handleInputChange} className="glass-input w-full px-3 py-2 rounded-lg">
                             <option value="一般員工">一般員工</option>
                             <option value="A TEAM">A TEAM</option>
                             <option value="內場DUTY">內場DUTY</option>
                             <option value="外場DUTY">外場DUTY</option>
                             <option value="管理員">管理員</option>
                        </select>
                    </div>
                    <input type="date" name="dob" value={editedPerson.dob} onChange={handleInputChange} className="glass-input w-full px-3 py-2 rounded-lg" />
                    <input type="tel" name="phone" value={editedPerson.phone} onChange={handleInputChange} placeholder="電話" className="glass-input w-full px-3 py-2 rounded-lg" />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-stone-500 hover:bg-stone-100 font-bold text-xs uppercase">取消</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-pizza-500 text-white hover:bg-pizza-600 shadow-lg font-bold text-xs uppercase">儲存</button>
                    </div>
                </div>
            </div>
        );
    }

    const progress = calculateProgress(person);

    return (
        <div className="glass-card relative group rounded-3xl p-6 flex flex-col h-full border border-white hover:border-pizza-400 bg-white/60">
            
            {/* Action buttons visible without hover for tablet support, but styled elegantly */}
            {canEdit && (
                <div className="absolute top-4 right-4 flex space-x-2 z-20">
                    <button onClick={() => setIsEditing(true)} className="texture-grain p-2 rounded-full bg-white text-stone-400 hover:text-pizza-500 hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDelete(person.id)} className="texture-grain p-2 rounded-full bg-white text-stone-400 hover:text-red-500 hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm">
                        <TrashIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
            
            <div className="relative z-10 mb-6">
                <Link to={`/personnel/${person.id}`} className="inline-block">
                    <h3 className="text-2xl font-bold text-stone-900 group-hover:text-pizza-600 transition-colors tracking-wide">
                        {person.name}
                    </h3>
                </Link>
                <div className="flex flex-wrap gap-2 mt-4">
                    {/* Apply specific colors for Job Titles */}
                    <Tag color={getJobTitleColor(person.jobTitle as string)}>{person.jobTitle}</Tag>
                    <Tag color={person.gender === '男性' ? 'indigo' : person.gender === '女性' ? 'pink' : 'purple'}>{person.gender}</Tag>
                </div>
            </div>

            <div className="relative z-10 mt-auto space-y-5">
                <div className="bg-white/50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">當前任務</p>
                    <p className="text-sm text-stone-800 font-medium truncate opacity-90">{getNextItemToLearn(person, trainingItems)}</p>
                </div>
                
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">完成進度</span>
                        <span className="text-xl font-syne font-bold text-pizza-500">{Math.round(progress)}%</span>
                    </div>
                    <ProgressBar progress={progress} />
                </div>
            </div>
        </div>
    );
};

interface PersonnelListPageProps {
  personnelList: Personnel[];
  trainingItems: TrainingItem[];
  jobTitleTags: TagData[];
  userRole: UserRole;
  onAddPersonnel: (person: Omit<Personnel, 'id' | 'trainingPlan' | 'status' | 'schedule' | 'role'>) => void;
  onUpdatePersonnel: (person: Personnel) => void;
  onDeletePersonnel: (id: string) => void;
  onImportPersonnel: (data: any[][]) => void;
}

const PersonnelListPage: React.FC<PersonnelListPageProps> = ({ personnelList, trainingItems, jobTitleTags, userRole, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onImportPersonnel }) => {
  
  if (userRole === 'user') {
      return <Navigate to="/" />;
  }

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'男性' | '女性' | '其他'>('男性');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('一般員工');
  const [newAccessCode, setNewAccessCode] = useState('');

  const canManage = ['admin', 'duty'].includes(userRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newDob && newPhone.trim() && newJobTitle.trim()) {
      const code = newAccessCode.trim() || (newPhone.length >= 4 ? newPhone.slice(-4) : '0000');
      
      onAddPersonnel({ 
          name: newName, 
          gender: newGender, 
          dob: newDob, 
          phone: newPhone, 
          jobTitle: newJobTitle,
          access_code: code
      });
      
      setNewName('');
      setNewGender('男性');
      setNewDob('');
      setNewPhone('');
      setNewJobTitle('一般員工');
      setNewAccessCode('');
      setIsFormVisible(false);
    }
  };
  
  const activePersonnel = personnelList.filter(p => p.status === '在職');
  const supportPersonnel = personnelList.filter(p => p.status === '支援');
  const resignedPersonnel = personnelList.filter(p => p.status === '離職');

  const renderPersonnelSection = (title: string, personnel: Personnel[], opacityClass: string = '') => {
    const sortedPersonnel = [...personnel].sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <div className={`mt-16 ${opacityClass}`}>
            <div className="flex flex-col items-start mb-8 gap-2">
                <div className="flex items-center gap-4 w-full">
                    <h2 className="text-3xl font-serif text-stone-800">{title}</h2>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-pizza-500 text-white text-xs font-bold">{personnel.length}</span>
                    <div className="h-px flex-grow bg-gradient-to-r from-stone-300 to-transparent"></div>
                </div>
            </div>
            
            {sortedPersonnel.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {sortedPersonnel.map(person => (
                        <PersonnelCard 
                            key={person.id} 
                            person={person} 
                            trainingItems={trainingItems}
                            jobTitleTags={jobTitleTags}
                            userRole={userRole}
                            onUpdate={onUpdatePersonnel}
                            onDelete={onDeletePersonnel}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-10 rounded-3xl text-center border-dashed border-stone-300">
                    <p className="text-stone-400 font-serif text-lg">此分類尚無人員</p>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-10 pb-24">
      <Importer
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={onImportPersonnel}
        title="匯入員工資料"
        columns={['姓名', '性別', '出生年月日', '電話', '職等', '身分證末四碼']}
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex flex-col items-start">
            <h1 className="text-4xl md:text-5xl font-playfair text-left font-bold text-stone-900 mb-2">夥伴名單</h1>
            <p className="text-stone-500 text-sm font-bold tracking-widest uppercase text-left">管理您的團隊與進度</p>
        </div>
        
        {canManage && (
            <div className="flex items-center space-x-4">
                <button 
                onClick={() => setIsImporterOpen(true)}
                className="texture-grain px-6 py-3 rounded-full border border-stone-400 text-stone-600 hover:text-pizza-600 hover:border-pizza-500 hover:bg-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                匯入資料
                </button>
                <button 
                onClick={() => setIsFormVisible(!isFormVisible)}
                className="texture-grain px-8 py-3 rounded-full bg-stone-900 text-white hover:bg-pizza-500 shadow-xl text-xs font-bold uppercase tracking-widest transition-all transform hover:scale-105"
                >
                {isFormVisible ? '關閉表單' : '新增夥伴'}
                </button>
            </div>
        )}
      </div>
      
      {isFormVisible && canManage && (
        <div className="glass-panel p-10 rounded-3xl mb-16 animate-fade-in border border-white">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-playfair text-stone-800">新增夥伴</h2>
                <button onClick={() => setIsFormVisible(false)} className="text-stone-400 hover:text-stone-800 text-2xl">&times;</button>
            </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="姓名" required className="glass-input w-full px-6 py-4 rounded-xl" />
            <select value={newGender} onChange={e => setNewGender(e.target.value as any)} required className="glass-input w-full px-6 py-4 rounded-xl">
              <option>男性</option>
              <option>女性</option>
              <option>其他</option>
            </select>
            <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} required className="glass-input w-full px-6 py-4 rounded-xl" />
            <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="電話號碼" required className="glass-input w-full px-6 py-4 rounded-xl" />
            <div>
                <select value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} className="glass-input w-full px-6 py-4 rounded-xl" required>
                    <option value="一般員工">一般員工</option>
                    <option value="A TEAM">A TEAM</option>
                    <option value="內場DUTY">內場DUTY</option>
                    <option value="外場DUTY">外場DUTY</option>
                    <option value="管理員">管理員</option>
                </select>
            </div>
            <div>
                <input type="text" value={newAccessCode} onChange={e => setNewAccessCode(e.target.value)} placeholder="登入代碼 (身分證末四碼)" className="glass-input w-full px-6 py-4 rounded-xl" maxLength={4} />
            </div>
            <button type="submit" className="texture-grain md:col-span-2 py-4 rounded-xl bg-pizza-500 hover:bg-pizza-600 text-white font-bold uppercase tracking-widest shadow-xl transition-all">建立夥伴資料</button>
          </form>
        </div>
      )}

      {renderPersonnelSection('在職夥伴', activePersonnel)}
      {renderPersonnelSection('支援夥伴', supportPersonnel, 'opacity-80')}
      {renderPersonnelSection('離職人員', resignedPersonnel, 'opacity-50 grayscale')}

    </div>
  );
};

export default PersonnelListPage;
