
import React from 'react';

interface CalendarProps {
    currentDate: Date;
    onMonthChange: (offset: number) => void;
    workDays: Set<string>;
    selectedDays: Set<string>;
    isScheduling: boolean;
    onDateClick: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onMonthChange, workDays, selectedDays, isScheduling, onDateClick }) => {

    const renderHeader = () => {
        const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' });
        
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        const sixMonthsHence = new Date(today.getFullYear(), today.getMonth() + 7, 0);

        const canGoBack = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) > sixMonthsAgo;
        const canGoForward = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) < new Date(sixMonthsHence.getFullYear(), sixMonthsHence.getMonth(), 1);

        return (
            <div className="flex items-center justify-between py-3 px-2 mb-2">
                <button onClick={() => onMonthChange(-1)} disabled={!canGoBack} className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-20">&lt;</button>
                <span className="text-lg font-bold text-stone-800 tracking-wide">{dateFormat.format(currentDate)}</span>
                <button onClick={() => onMonthChange(1)} disabled={!canGoForward} className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-20">&gt;</button>
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
                const isWorkDay = workDays.has(dayStr);
                const isSelected = selectedDays.has(dayStr);

                let cellBase = 'w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-all text-sm relative ';
                
                if (isScheduling) {
                     if (isSelected) cellBase += 'bg-pizza-500 text-white shadow-lg scale-110 z-10 ';
                     else if (isCurrentMonth) cellBase += 'text-stone-400 hover:bg-stone-100 ';
                     else cellBase += 'text-stone-300 ';
                } else {
                     if (isWorkDay) {
                         cellBase += 'bg-stone-100 text-stone-800 font-bold shadow-inner border border-stone-200 ';
                         // Add a small dot for workdays
                         cellBase += 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-pizza-500 after:rounded-full ';
                     } else if (isCurrentMonth) {
                         cellBase += 'text-stone-500 hover:bg-stone-50 ';
                     } else {
                         cellBase += 'text-stone-300 ';
                     }
                }

                if (isToday) {
                    cellBase += 'border border-pizza-500 text-pizza-600 font-bold ';
                }

                days.push(
                    <div
                        key={dayStr}
                        className={`p-1 h-10 ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => isCurrentMonth && onDateClick(dayStr)}
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
        <div className="bg-white border border-stone-200 rounded-xl p-2 shadow-sm">
            {renderHeader()}
            {renderDaysOfWeek()}
            {renderCells()}
        </div>
    );
};

export default Calendar;
