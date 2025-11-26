
import React, { useState } from 'react';

interface CalendarProps {
    currentDate: Date;
    onMonthChange: (offset: number) => void;
    // Allow parent to set specific date directly (for year/month jump)
    onDateSet?: (date: Date) => void;
    workDays?: Set<string>;
    selectedDays?: Set<string>;
    isScheduling?: boolean;
    onDateClick: (date: string) => void;
    simpleMode?: boolean;
    activeDate?: string;
}

type CalendarView = 'dates' | 'months' | 'years';

const Calendar: React.FC<CalendarProps> = ({ 
    currentDate, 
    onMonthChange, 
    onDateSet,
    workDays = new Set(), 
    selectedDays = new Set(), 
    isScheduling = false, 
    onDateClick,
    simpleMode = false,
    activeDate
}) => {
    const [view, setView] = useState<CalendarView>('dates');

    // Navigate Year/Month logic
    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
        if (onDateSet) onDateSet(newDate);
        else {
            // Fallback if onDateSet not provided (calculate offset)
            const currentMonth = currentDate.getMonth();
            onMonthChange(monthIndex - currentMonth);
        }
        setView('dates');
    };

    const handleYearSelect = (year: number) => {
        const newDate = new Date(year, currentDate.getMonth(), 1);
        if (onDateSet) onDateSet(newDate);
        else {
             // This fallback is tricky for years, implies we need onDateSet for full functionality
             // But we can hack offset if needed. Better to rely on onDateSet.
             const offset = (year - currentDate.getFullYear()) * 12;
             onMonthChange(offset);
        }
        setView('months'); // Go to months after year select, natural flow
    };

    const renderHeader = () => {
        const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' });
        const yearFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric' });

        return (
            <div className="flex items-center justify-between py-3 px-2 mb-2">
                {view === 'dates' && (
                    <>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMonthChange(-1); }} 
                            className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                        >
                            &lt;
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setView('months'); }}
                            className="text-lg font-bold text-stone-800 tracking-wide hover:text-pizza-500 transition-colors px-2 py-1 rounded hover:bg-stone-50"
                        >
                            {dateFormat.format(currentDate)}
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMonthChange(1); }} 
                            className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                        >
                            &gt;
                        </button>
                    </>
                )}
                {view === 'months' && (
                    <div className="w-full flex justify-center">
                         <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setView('years'); }}
                            className="text-lg font-bold text-stone-800 tracking-wide hover:text-pizza-500 transition-colors px-2 py-1 rounded hover:bg-stone-50"
                        >
                            {yearFormat.format(currentDate)}
                        </button>
                    </div>
                )}
                {view === 'years' && (
                    <div className="w-full flex justify-center">
                        <span className="text-lg font-bold text-stone-800 tracking-wide">選擇年份</span>
                    </div>
                )}
            </div>
        );
    };

    const renderMonths = () => {
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(currentDate.getFullYear(), i, 1);
            return new Intl.DateTimeFormat('zh-TW', { month: 'short' }).format(d);
        });

        return (
            <div className="grid grid-cols-3 gap-4 p-4">
                {months.map((m, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMonthSelect(i); }}
                        className={`py-3 rounded-xl text-sm font-bold transition-colors ${i === currentDate.getMonth() ? 'bg-pizza-500 text-white shadow-md' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        );
    };

    const renderYears = () => {
        const currentYear = currentDate.getFullYear();
        const startYear = currentYear - 10;
        const endYear = currentYear + 10;
        const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

        return (
            <div className="grid grid-cols-4 gap-2 p-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                {years.map(y => (
                    <button
                        key={y}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleYearSelect(y); }}
                        className={`py-2 rounded-lg text-sm font-bold transition-colors ${y === currentYear ? 'bg-pizza-500 text-white shadow-md' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                    >
                        {y}
                    </button>
                ))}
            </div>
        );
    };

    const renderDaysOfWeek = () => {
        const days = ['一', '二', '三', '四', '五', '六', '日'];
        return (
            <div className="grid grid-cols-7 text-center text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                {days.map(day => <div key={day} className="py-1">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startDate = new Date(monthStart);
        let startDayOfWeek = startDate.getDay() - 1; 
        if (startDayOfWeek === -1) startDayOfWeek = 6;
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        const rows = [];
        let days = [];
        let day = new Date(startDate);
        
        while (rows.length < 6) {
            for (let i = 0; i < 7; i++) {
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const date = String(day.getDate()).padStart(2, '0');
                const dayStr = `${year}-${month}-${date}`;

                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                
                let cellBase = 'w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-all text-sm relative ';
                let containerClass = `p-1 h-10 ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}`;

                if (simpleMode) {
                    if (dayStr === activeDate) {
                        cellBase += 'bg-pizza-500 text-white font-bold shadow-md scale-110 ';
                    } else if (isCurrentMonth) {
                        cellBase += 'text-stone-700 hover:bg-stone-100 ';
                    } else {
                        cellBase += 'text-stone-300 ';
                    }
                } else {
                    const isWorkDay = workDays && workDays.has(dayStr);
                    const isSelected = selectedDays && selectedDays.has(dayStr);

                    if (isScheduling) {
                         if (isSelected) cellBase += 'bg-pizza-500 text-white shadow-lg scale-110 z-10 ';
                         else if (isCurrentMonth) cellBase += 'text-stone-400 hover:bg-stone-100 ';
                         else cellBase += 'text-stone-300 ';
                    } else {
                         if (isWorkDay) {
                             cellBase += 'bg-stone-100 text-stone-800 font-bold shadow-inner border border-stone-200 ';
                             cellBase += 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-pizza-500 after:rounded-full ';
                         } else if (isCurrentMonth) {
                             cellBase += 'text-stone-500 hover:bg-stone-50 ';
                         } else {
                             cellBase += 'text-stone-300 ';
                         }
                    }
                }

                if (isToday && !simpleMode) {
                    cellBase += 'border border-pizza-500 text-pizza-600 font-bold ';
                } else if (isToday && simpleMode && dayStr !== activeDate) {
                    cellBase += 'border border-pizza-300 text-pizza-600 ';
                }

                days.push(
                    <div
                        key={dayStr}
                        className={containerClass}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isCurrentMonth) onDateClick(dayStr);
                        }}
                    >
                        <span className={cellBase}>
                            {day.getDate()}
                        </span>
                    </div>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(<div className="grid grid-cols-7" key={rows.length}>{days}</div>);
            days = [];
        }
        return <div>{rows}</div>;
    };

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-2 shadow-sm select-none min-w-[300px]">
            {renderHeader()}
            {view === 'dates' ? (
                <>
                    {renderDaysOfWeek()}
                    {renderCells()}
                </>
            ) : view === 'months' ? (
                renderMonths()
            ) : (
                renderYears()
            )}
        </div>
    );
};

export default Calendar;
