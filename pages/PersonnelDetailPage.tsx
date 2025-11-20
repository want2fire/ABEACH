
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TrainingAssignment, type TagData, type DailySchedule, type UserRole } from '../types';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import Calendar from '../components/Calendar';
import { PlusIcon } from '../components/icons/PlusIcon';

// Helper functions for date manipulation
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
    // Only uncompleted items can be scheduled
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
        if (newItems.length === 0) delete newSchedule[date]; // Clean up empty entries
        onUpdateSchedule(newSchedule);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">編輯 {date} 的任務</h3>
                    <p className="text-sm text-slate-500">從下方的待學習清單中勾選任務以加入排程。</p>
                </div>
                <div className="p-4 overflow-y-auto">
                    {availableItems.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                            {availableItems.map(item => (
                                <li key={item.id} className="py-2 flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`item-${item.id}`}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        checked={scheduledItemIds.includes(item.id)}
                                        onChange={() => toggleItemForDate(item.id)}
                                    />
                                    <label htmlFor={`item-${item.id}`} className="ml-3 flex-grow">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-slate-500">{item.chapter} / {item.workArea}</p>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 py-4">所有指派的任務皆已完成！</p>
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="btn-secondary">完成</button>
                </div>
            </div>
        </div>
    );
};


const PersonnelDetailPage: React.FC<PersonnelDetailPageProps> = ({ personnelList, trainingItems, jobTitleTags, userRole, onUpdatePersonnel, onUpdateSchedule }) => {
  const { personnelId } = useParams<{ personnelId: string }>();
  
  const person = personnelList.find(p => p.id === personnelId);

  // State for the new scheduling UI
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<'set-work' | 'set-rest'>('set-work');
  const [tempScheduleSelection, setTempScheduleSelection] = useState(new Set<string>());
  
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string | null>(null);
  
  // Lifted state for calendar's current month
  const [calendarDate, setCalendarDate] = useState(new Date());

  const canManage = ['admin', 'duty'].includes(userRole);

  const workDays = useMemo(() => new Set(Object.keys(person?.schedule || {})), [person?.schedule]);

  const scheduleData = useMemo(() => {
    if (!person) return { today: [], thisWeek: [], unfinished: [], nextWorkday: [] };
    
    const todayStr = getTodayDateString();
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const startOfWeek = getStartOfWeek(new Date());
    
    const todayItems = person.schedule[todayStr] || [];
    
    const weekItems: { date: string, items: string[] }[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        if (person.schedule[dayStr]) {
            weekItems.push({ date: dayStr, items: person.schedule[dayStr] });
        }
    }

    const unfinishedItems = Object.entries(person.schedule)
        .filter(([date]) => {
            const d = new Date(date);
            d.setHours(0,0,0,0);
            return d < today;
        })
        .flatMap(([, itemIds]) => itemIds)
        .filter(itemId => !person.trainingPlan.find(p => p.itemId === itemId)?.completed);

    const sortedScheduledDates = Object.keys(person.schedule).sort();
    const nextWorkdayDate = sortedScheduledDates.find(date => date > todayStr);
    const nextWorkdayItems = nextWorkdayDate ? person.schedule[nextWorkdayDate] : [];

    return {
        today: todayItems,
        thisWeek: weekItems,
        unfinished: [...new Set(unfinishedItems)], // Remove duplicates
        nextWorkday: nextWorkdayItems,
    };
  }, [person]);

  if (!person) {
    return <Navigate to="/" />;
  }
  
  const handleMonthChange = (offset: number) => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleDateClick = (dateStr: string) => {
    if (isScheduling) {
        // In scheduling mode, update the temporary selection
        setTempScheduleSelection(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(dateStr)) {
                newSelection.delete(dateStr);
            } else {
                newSelection.add(dateStr);
            }
            return newSelection;
        });
    } else {
        // In normal mode, open the daily task modal if it's a workday
        if (workDays.has(dateStr) && canManage) {
            setSelectedScheduleDate(dateStr);
        }
    }
  };

  const handleStartScheduling = () => {
    setTempScheduleSelection(new Set(workDays));
    setIsScheduling(true);
  };

  const handleCancelScheduling = () => {
    setIsScheduling(false);
    setTempScheduleSelection(new Set());
  };

  const handleConfirmSchedule = () => {
    if (!person) return;
    const newSchedule: DailySchedule = { ...person.schedule };

    if (schedulingMode === 'set-work') {
      tempScheduleSelection.forEach(date => {
        if (!newSchedule[date]) newSchedule[date] = [];
      });
    } else { // 'set-rest'
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            if (tempScheduleSelection.has(dateStr)) {
                // This is a rest day, remove it from schedule
                delete newSchedule[dateStr];
            } else {
                // This is a work day, ensure it exists in schedule
                if (!newSchedule[dateStr]) {
                    newSchedule[dateStr] = [];
                }
            }
        }
    }
    
    onUpdateSchedule(person.id, newSchedule);
    setIsScheduling(false);
  };

  const handleToggleComplete = (itemId: string, completed: boolean) => {
    const updatedPlan = person.trainingPlan.map(item =>
        item.itemId === itemId ? { ...item, completed } : item
    );
    onUpdatePersonnel({ ...person, trainingPlan: updatedPlan });
  };
  
  const getItemDetails = (itemId: string) => trainingItems.find(item => item.id === itemId);

  const renderMasterTaskList = (assignments: TrainingAssignment[]) => {
    if (assignments.length === 0) return <p className="text-center text-slate-500 py-4">無項目</p>;
  
    const sortedAssignments = assignments
      .map(p => ({ ...p, details: getItemDetails(p.itemId) }))
      .filter(p => p.details)
      .sort((a, b) => {
        return a.details!.chapter.localeCompare(b.details!.chapter, undefined, { numeric: true });
      });

    return (
      <ul className="space-y-2">
        {sortedAssignments.map(({ itemId, completed, details }) => (
          <li key={itemId} className={`flex items-center p-3 rounded-md transition-colors ${completed ? 'bg-green-50 text-slate-500' : 'bg-white hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => handleToggleComplete(itemId, e.target.checked)}
              className={`h-5 w-5 rounded border-slate-300 ${completed ? 'text-green-600 focus:ring-green-500' : 'text-sky-600 focus:ring-sky-500'}`}
              id={`master-checkbox-${itemId}`}
            />
            <label htmlFor={`master-checkbox-${itemId}`} className="ml-3 flex-grow cursor-pointer">
              <span className={`block font-medium ${completed ? 'line-through' : 'text-slate-800'}`}>{details!.name}</span>
              <div className="flex items-center space-x-2 text-xs mt-1">
                <Tag color="green">{details!.chapter}</Tag>
                <Tag color="sky">{details!.workArea}</Tag>
                <Tag color="purple">{details!.typeTag}</Tag>
              </div>
            </label>
          </li>
        ))}
      </ul>
    );
  };
  
  const renderScheduledTaskList = (itemIds: string[]) => {
    if (itemIds.length === 0) return <p className="text-center text-slate-500 py-4">無項目</p>;
    
    const items = itemIds.map(getItemDetails).filter((i): i is TrainingItem => !!i);
    
    return (
        <ul className="space-y-2">
            {items.map(item => {
                 const assignment = person.trainingPlan.find(p => p.itemId === item.id);
                 const isCompleted = assignment?.completed || false;
                 return (
                    <li key={item.id} className={`flex items-center p-2 rounded-md ${isCompleted ? 'bg-green-50 text-slate-500' : 'bg-slate-50'}`}>
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => handleToggleComplete(item.id, !isCompleted)}
                            className={`h-5 w-5 rounded border-slate-300 ${isCompleted ? 'text-green-600 focus:ring-green-500' : 'text-sky-600 focus:ring-sky-500'}`}
                        />
                        <div className="ml-3 flex-grow">
                            <p className={`font-medium ${isCompleted ? 'line-through' : 'text-slate-800'}`}>{item.name}</p>
                            <p className="text-sm">{item.chapter}</p>
                        </div>
                    </li>
                 )
            })}
        </ul>
    );
  };
  
  const weekProgress = () => {
    const allWeekItems = scheduleData.thisWeek.flatMap(d => d.items);
    if (allWeekItems.length === 0) return 100;
    const completedCount = allWeekItems.filter(itemId => person.trainingPlan.find(p=>p.itemId===itemId)?.completed).length;
    return (completedCount / allWeekItems.length) * 100;
  };

  const calculateAge = (dob: string): number => new Date().getFullYear() - new Date(dob).getFullYear();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); } .btn-secondary { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #334155; background-color: white; } .btn-secondary:hover { background-color: #f1f5f9; }`}</style>
      <ScheduleItemModal 
        isOpen={!!selectedScheduleDate}
        onClose={() => setSelectedScheduleDate(null)}
        date={selectedScheduleDate || ''}
        person={person}
        trainingItems={trainingItems}
        onUpdateSchedule={(schedule) => onUpdateSchedule(person.id, schedule)}
      />
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{person.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
            <Tag color={jobTitleTags.find(t=>t.value === person.jobTitle)?.color || 'sky'}>{person.jobTitle}</Tag>
            <Tag color={person.gender === '男性' ? 'indigo' : person.gender === '女性' ? 'pink' : 'purple'}>{person.gender}</Tag>
            <Tag color="amber">{calculateAge(person.dob)} 歲</Tag>
            <Tag color="green">{person.phone}</Tag>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Schedule & Progress Widgets */}
        <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">該人員班表</h2>
                <Calendar 
                    currentDate={calendarDate}
                    onMonthChange={handleMonthChange}
                    workDays={workDays}
                    selectedDays={isScheduling ? tempScheduleSelection : new Set()}
                    isScheduling={isScheduling}
                    onDateClick={handleDateClick}
                />
                
                {!isScheduling && canManage && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 text-center">點擊已標示的上班日以編輯當日任務</p>
                        <button onClick={handleStartScheduling} className="mt-2 w-full text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-md text-sm px-4 py-2 text-center transition-colors">
                            排班設定
                        </button>
                    </div>
                )}
                
                {isScheduling && (
                    <div className="mt-4 pt-4 border-t border-slate-200 animate-fade-in">
                        <style>{`@keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
                        <h3 className="text-lg font-semibold mb-2">排班設定模式</h3>
                        <div className="flex items-center space-x-4 mb-3 p-2 bg-slate-100 rounded-md">
                            <label className="flex items-center cursor-pointer flex-1 justify-center">
                                <input type="radio" name="scheduleMode" value="set-work" checked={schedulingMode === 'set-work'} onChange={() => setSchedulingMode('set-work')} className="form-radio h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"/>
                                <span className="ml-2 text-sm text-slate-700 font-medium">設定上班日</span>
                            </label>
                            <label className="flex items-center cursor-pointer flex-1 justify-center">
                                <input type="radio" name="scheduleMode" value="set-rest" checked={schedulingMode === 'set-rest'} onChange={() => setSchedulingMode('set-rest')} className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300"/>
                                <span className="ml-2 text-sm text-slate-700 font-medium">設定休假日</span>
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 text-center">
                          {schedulingMode === 'set-work' ? '點擊日曆以增加上班日' : '點擊日曆選擇休假日，該月其餘日期將設為上班日'}
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCancelScheduling} className="btn-secondary">取消</button>
                            <button onClick={handleConfirmSchedule} className="w-full text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-md text-sm px-4 py-2 text-center transition-colors">
                                確認安排
                            </button>
                        </div>
                    </div>
                )}

            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">本日進度</h3>
                    {renderScheduledTaskList(scheduleData.today)}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">當週進度</h3>
                        <span className="text-sm font-medium text-sky-600">{Math.round(weekProgress())}%</span>
                     </div>
                     <ProgressBar progress={weekProgress()} />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2 text-amber-700">未完成進度 ({scheduleData.unfinished.length})</h3>
                    {renderScheduledTaskList(scheduleData.unfinished)}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">下次上班日進度</h3>
                    {renderScheduledTaskList(scheduleData.nextWorkday)}
                </div>
            </div>
        </div>
        
        {/* Right Column: Master Task Lists */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">待學習的任務總表</h2>
                <div className="max-h-[60vh] overflow-y-auto p-1 bg-slate-50 rounded-md">
                    {renderMasterTaskList(person.trainingPlan.filter(p => !p.completed))}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">已完成的學習任務總表</h2>
                 <div className="max-h-[60vh] overflow-y-auto p-1 bg-slate-50 rounded-md">
                    {renderMasterTaskList(person.trainingPlan.filter(p => p.completed))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetailPage;
