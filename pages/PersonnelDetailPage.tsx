import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TrainingAssignment, type TagData, type DailySchedule, type UserRole } from '../types';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import Calendar from '../components/Calendar';

// ... (Helper functions remain same)
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

interface PersonnelDetailPageProps {
  personnelList: Personnel[];
  trainingItems: TrainingItem[];
  jobTitleTags: TagData[];
  userRole: UserRole;
  onUpdatePersonnel: (updatedPersonnel: Personnel) => void;
  onUpdateSchedule: (personnelId: string, schedule: DailySchedule) => void;
}

// ... (ScheduleItemModal remains same)
const ScheduleItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    date: string;
    person: Personnel;
    trainingItems: TrainingItem[];
    onUpdateSchedule: (schedule: DailySchedule) => void;
}> = ({ isOpen, onClose, date, person, trainingItems, onUpdateSchedule }) => {
    if (!isOpen) return null;
    
    const scheduledItemIds = person.schedule[date] || [];
    const availableItems = person.trainingPlan
        .filter(p => !p.completed)
        .map(p => trainingItems.find(item => item.id === p.itemId))
        .filter((item): item is TrainingItem => !!item);

    const toggleItemForDate = (itemId: string) => {
        const currentItems = person.schedule[date] || [];
        const newItems = currentItems.includes(itemId)
            ? currentItems.filter(id => id !== itemId)
            : [...currentItems, itemId];
        
        const newSchedule = { ...person.schedule, [date]: newItems };
        if (newItems.length === 0) delete newSchedule[date];
        onUpdateSchedule(newSchedule);
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="glass-panel rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl bg-white">
                <div className="p-6 border-b border-stone-100">
                    <h3 className="text-xl font-bold text-stone-800">指派當日任務 <span className="text-pizza-500 font-syne text-lg">@ {date}</span></h3>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {availableItems.length > 0 ? (
                        <ul className="space-y-3">
                            {availableItems.map(item => (
                                <li key={item.id} className={`p-4 rounded-xl flex items-center cursor-pointer transition-all ${scheduledItemIds.includes(item.id) ? 'bg-pizza-50 border border-pizza-200' : 'bg-stone-50 border border-transparent hover:bg-stone-100'}`}>
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-stone-300 bg-white text-pizza-500 focus:ring-pizza-500"
                                        checked={scheduledItemIds.includes(item.id)}
                                        onChange={() => toggleItemForDate(item.id)}
                                    />
                                    <div className="ml-4 flex-grow" onClick={() => toggleItemForDate(item.id)}>
                                        <p className="font-bold text-stone-800 font-sans">{item.name}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-600">{item.chapter}</span>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-600">{item.workArea}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-stone-500 py-10 font-serif">已無可指派的任務！</p>
                    )}
                </div>
                <div className="p-6 border-t border-stone-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 rounded-full bg-pizza-500 text-white hover:bg-pizza-600 font-bold uppercase text-xs tracking-widest shadow-lg">完成</button>
                </div>
            </div>
        </div>
    );
};

const PersonnelDetailPage: React.FC<PersonnelDetailPageProps> = ({ personnelList, trainingItems, jobTitleTags, userRole, onUpdatePersonnel, onUpdateSchedule }) => {
  const { personnelId } = useParams<{ personnelId: string }>();
  const person = personnelList.find(p => p.id === personnelId);

  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<'set-work' | 'set-rest'>('set-work');
  const [tempScheduleSelection, setTempScheduleSelection] = useState(new Set<string>());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPerson, setEditedPerson] = useState<Personnel | null>(null);

  const canManage = ['admin', 'duty'].includes(userRole);

  const workDays = useMemo(() => new Set(Object.keys(person?.schedule || {})), [person?.schedule]);

  useEffect(() => {
      if (person) {
          setEditedPerson(person);
      }
  }, [person]);

  // ... (scheduleData useMemo logic remains same)
  const scheduleData = useMemo(() => {
    if (!person) return { today: [], thisWeek: [], unfinished: [], nextWorkday: [] };
    const todayStr = getTodayDateString();
    const today = new Date(todayStr); today.setHours(0, 0, 0, 0);
    const startOfWeek = getStartOfWeek(new Date());
    
    const todayItems = person.schedule[todayStr] || [];
    const weekItems: { date: string, items: string[] }[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek); day.setDate(startOfWeek.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        if (person.schedule[dayStr]) weekItems.push({ date: dayStr, items: person.schedule[dayStr] });
    }

    const unfinishedItems = Object.entries(person.schedule)
        .filter(([date]) => { const d = new Date(date); d.setHours(0,0,0,0); return d < today; })
        .flatMap(([, itemIds]) => itemIds)
        .filter(itemId => !person.trainingPlan.find(p => p.itemId === itemId)?.completed);

    const sortedScheduledDates = Object.keys(person.schedule).sort();
    const nextWorkdayDate = sortedScheduledDates.find(date => date > todayStr);
    const nextWorkdayItems = nextWorkdayDate ? person.schedule[nextWorkdayDate] : [];

    return { today: todayItems, thisWeek: weekItems, unfinished: [...new Set(unfinishedItems)], nextWorkday: nextWorkdayItems };
  }, [person]);

  if (!person) return <Navigate to="/" />;
  
  // ... (handlers remain same)
  const handleMonthChange = (offset: number) => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));

  const handleDateClick = (dateStr: string) => {
    if (isScheduling) {
        setTempScheduleSelection(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(dateStr)) newSelection.delete(dateStr);
            else newSelection.add(dateStr);
            return newSelection;
        });
    } else {
        if (workDays.has(dateStr) && canManage) setSelectedScheduleDate(dateStr);
    }
  };

  const handleStartScheduling = () => { setTempScheduleSelection(new Set(workDays)); setIsScheduling(true); };
  const handleCancelScheduling = () => { setIsScheduling(false); setTempScheduleSelection(new Set()); };

  const handleConfirmSchedule = () => {
    if (!person) return;
    const newSchedule: DailySchedule = { ...person.schedule };

    if (schedulingMode === 'set-work') {
      tempScheduleSelection.forEach(date => { if (!newSchedule[date]) newSchedule[date] = []; });
    } else {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (tempScheduleSelection.has(dateStr)) delete newSchedule[dateStr];
            else if (!newSchedule[dateStr]) newSchedule[dateStr] = [];
        }
    }
    onUpdateSchedule(person.id, newSchedule); setIsScheduling(false);
  };

  const handleToggleComplete = (itemId: string, completed: boolean) => {
    if (!canManage) return;
    const updatedPlan = person.trainingPlan.map(item => item.itemId === itemId ? { ...item, completed } : item);
    onUpdatePersonnel({ ...person, trainingPlan: updatedPlan });
  };
  
  const getItemDetails = (itemId: string) => trainingItems.find(item => item.id === itemId);

  // Handle Edit Form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!editedPerson) return;
      const { name, value } = e.target;
      setEditedPerson({ ...editedPerson, [name]: value });
  };

  const handleSavePersonnel = () => {
      if (editedPerson) {
          onUpdatePersonnel(editedPerson);
          setIsEditing(false);
      }
  };

  const renderTaskList = (assignments: TrainingAssignment[]) => {
    if (assignments.length === 0) return <div className="text-center text-stone-400 py-8 border-2 border-dashed border-stone-200 rounded-2xl font-serif">目前沒有任務</div>;
    const sorted = assignments.map(p => ({ ...p, details: getItemDetails(p.itemId) })).filter(p => p.details).sort((a, b) => a.details!.chapter.localeCompare(b.details!.chapter, undefined, { numeric: true }));

    return (
      <ul className="space-y-3">
        {sorted.map(({ itemId, completed, details }) => (
          <li key={itemId} className={`flex items-center p-4 rounded-xl border transition-all ${completed ? 'bg-palm-50 border-palm-200 text-palm-600/70' : 'bg-white border-stone-100 hover:border-stone-300'}`}>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => handleToggleComplete(itemId, e.target.checked)}
              disabled={!canManage}
              className={`h-5 w-5 rounded bg-white border-stone-300 ${completed ? 'text-palm-500 focus:ring-palm-500' : 'text-pizza-500 focus:ring-pizza-500'} focus:ring-offset-white disabled:opacity-50`}
            />
            <label className={`ml-4 flex-grow ${canManage ? 'cursor-pointer' : ''}`}>
              <span className={`block font-bold font-sans text-base ${completed ? 'line-through opacity-70' : 'text-stone-800'}`}>{details!.name}</span>
              <div className={`flex gap-2 mt-1 text-[10px] uppercase tracking-wider font-bold ${completed ? 'opacity-50' : ''}`}>
                 <span className="text-stone-500">{details!.chapter}</span>
                 <span className="text-stone-300">•</span>
                 <span className="text-stone-500">{details!.workArea}</span>
              </div>
            </label>
          </li>
        ))}
      </ul>
    );
  };

  const renderDailyList = (itemIds: string[]) => {
    if (itemIds.length === 0) return <p className="text-xs text-stone-400 font-serif">無安排</p>;
    return (
        <ul className="space-y-2">
            {itemIds.map(getItemDetails).filter((i): i is TrainingItem => !!i).map(item => {
                 const isCompleted = person.trainingPlan.find(p => p.itemId === item.id)?.completed || false;
                 return (
                    <li key={item.id} className={`flex items-center p-2 rounded ${isCompleted ? 'text-stone-400 line-through opacity-50' : 'text-stone-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isCompleted ? 'bg-palm-500' : 'bg-pizza-500'}`}></div>
                        <span className="text-sm font-medium">{item.name}</span>
                    </li>
                 )
            })}
        </ul>
    );
  };
  
  return (
    <div className="container mx-auto p-6 sm:p-8 lg:p-10 pb-24">
      <ScheduleItemModal 
        isOpen={!!selectedScheduleDate}
        onClose={() => setSelectedScheduleDate(null)}
        date={selectedScheduleDate || ''}
        person={person}
        trainingItems={trainingItems}
        onUpdateSchedule={(schedule) => onUpdateSchedule(person.id, schedule)}
      />
      
      <div className="glass-panel p-10 rounded-3xl mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/60 relative">
        {/* Edit Button for Admin/Duty */}
        {canManage && !isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-6 right-6 texture-grain px-4 py-2 bg-white text-stone-500 border border-stone-200 rounded-full text-xs font-bold uppercase hover:bg-pizza-50 hover:text-pizza-600 hover:border-pizza-200 transition-all"
            >
                編輯資料
            </button>
        )}

        {!isEditing ? (
            <div>
                {/* Name Non-Italic */}
                <h1 className="text-5xl font-playfair font-bold text-stone-900 mb-4">{person.name}</h1>
                <div className="flex flex-wrap gap-3">
                    <Tag color={jobTitleTags.find(t=>t.value === person.jobTitle)?.color || 'sky'}>{person.jobTitle}</Tag>
                    <Tag color="amber">{new Date().getFullYear() - new Date(person.dob).getFullYear()} 歲</Tag>
                    <Tag color="slate">{person.phone}</Tag>
                </div>
            </div>
        ) : (
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-stone-800">編輯人員資料</h2>
                    <div className="flex gap-2">
                        <button onClick={() => { setIsEditing(false); setEditedPerson(person); }} className="px-4 py-2 rounded-lg text-stone-500 text-xs font-bold uppercase hover:bg-stone-100">取消</button>
                        <button onClick={handleSavePersonnel} className="px-6 py-2 rounded-lg bg-pizza-500 text-white text-xs font-bold uppercase shadow-lg hover:bg-pizza-600">儲存</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" name="name" value={editedPerson?.name || ''} onChange={handleInputChange} placeholder="姓名" className="glass-input w-full px-4 py-3 rounded-xl" />
                    <input type="tel" name="phone" value={editedPerson?.phone || ''} onChange={handleInputChange} placeholder="電話" className="glass-input w-full px-4 py-3 rounded-xl" />
                    <select name="jobTitle" value={editedPerson?.jobTitle || ''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl">
                         <option value="一般員工">一般員工</option>
                         <option value="A TEAM">A TEAM</option>
                         <option value="內場DUTY">內場DUTY</option>
                         <option value="外場DUTY">外場DUTY</option>
                         <option value="管理員">管理員</option>
                    </select>
                    <div className="flex gap-2">
                        <select name="status" value={editedPerson?.status || '在職'} onChange={handleInputChange} className="glass-input w-1/2 px-4 py-3 rounded-xl">
                            <option value="在職">在職</option>
                            <option value="支援">支援</option>
                            <option value="離職">離職</option>
                        </select>
                        <input type="text" name="access_code" value={editedPerson?.access_code || ''} onChange={handleInputChange} placeholder="登入碼" maxLength={4} className="glass-input w-1/2 px-4 py-3 rounded-xl text-center" />
                    </div>
                    <input type="date" name="dob" value={editedPerson?.dob || ''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" />
                </div>
            </div>
        )}
        {/* Access Code REMOVED for Privacy */}
      </div>
      
      {/* Rest of the layout for Calendar and Task Lists remains the same */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar & Widgets */}
        <div className="lg:col-span-5 space-y-8">
            <div className="glass-panel p-8 rounded-3xl bg-white/80">
                <h2 className="text-sm font-bold text-stone-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <span className="w-2 h-2 bg-pizza-500 rounded-full"></span>
                    排班表
                </h2>
                <Calendar 
                    currentDate={calendarDate}
                    onMonthChange={handleMonthChange}
                    workDays={workDays}
                    selectedDays={isScheduling ? tempScheduleSelection : new Set()}
                    isScheduling={isScheduling}
                    onDateClick={handleDateClick}
                />
                
                {!isScheduling && canManage && (
                    <button onClick={handleStartScheduling} className="texture-grain mt-6 w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider rounded-xl py-3 text-xs transition-colors border border-stone-200">
                        調整班表
                    </button>
                )}
                
                {isScheduling && (
                    <div className="mt-6 p-4 bg-pizza-50 border border-pizza-200 rounded-2xl animate-fade-in">
                        <div className="flex gap-3 mb-4">
                             <button onClick={() => setSchedulingMode('set-work')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${schedulingMode === 'set-work' ? 'bg-pizza-500 text-white shadow-lg' : 'bg-white text-stone-500 border border-stone-200'}`}>上班</button>
                             <button onClick={() => setSchedulingMode('set-rest')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${schedulingMode === 'set-rest' ? 'bg-stone-600 text-white shadow-lg' : 'bg-white text-stone-500 border border-stone-200'}`}>休假</button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCancelScheduling} className="flex-1 py-3 rounded-xl text-stone-500 hover:bg-stone-200 text-xs font-bold uppercase">取消</button>
                            <button onClick={handleConfirmSchedule} className="flex-1 py-3 rounded-xl bg-palm-600 hover:bg-palm-500 text-white text-xs font-bold uppercase shadow-lg tracking-wider">儲存</button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-3xl border-t-4 border-t-pizza-500 bg-white/70">
                    <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">今日任務</h3>
                    {renderDailyList(scheduleData.today)}
                </div>
                <div className="glass-card p-6 rounded-3xl border-t-4 border-t-sky-500 bg-white/70">
                    <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">下次上班</h3>
                    {renderDailyList(scheduleData.nextWorkday)}
                </div>
                <div className="glass-card p-6 rounded-3xl border-t-4 border-t-red-500 col-span-2 bg-white/70">
                    <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">未完成 / 逾期</h3>
                    {renderDailyList(scheduleData.unfinished)}
                </div>
            </div>
        </div>
        
        {/* Task Lists */}
        <div className="lg:col-span-7 space-y-8">
            <div className="glass-panel p-8 rounded-3xl min-h-[600px] bg-white/80">
                <h2 className="text-sm font-bold text-stone-500 mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <span className="w-2 h-2 bg-stone-800 rounded-full"></span>
                    總訓練清單
                </h2>
                
                <div className="space-y-10">
                    <div>
                        <div className="flex justify-between items-end mb-4 border-b border-stone-200 pb-2">
                            <span className="text-base font-playfair text-pizza-600">未完成</span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{person.trainingPlan.filter(p => !p.completed).length} 項</span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {renderTaskList(person.trainingPlan.filter(p => !p.completed))}
                        </div>
                    </div>

                    <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-end mb-4 border-b border-stone-200 pb-2">
                            <span className="text-base font-playfair text-palm-600">已完成</span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{person.trainingPlan.filter(p => p.completed).length} 項</span>
                        </div>
                         <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {renderTaskList(person.trainingPlan.filter(p => p.completed))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetailPage;