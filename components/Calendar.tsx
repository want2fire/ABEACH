import React from 'react';

interface CalendarProps {
    currentDate: Date;
    onMonthChange: (offset: number) => void;
    workDays: Set<string>; // "YYYY-MM-DD" - Official workdays
    selectedDays: Set<string>; // "YYYY-MM-DD" - Temporarily selected days during scheduling
    isScheduling: boolean;
    onDateClick: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onMonthChange, workDays, selectedDays, isScheduling, onDateClick }) => {

    const renderHeader = () => {
        const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' });
        
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        const sixMonthsHence = new Date(today.getFullYear(), today.getMonth() + 7, 0); // Last day of the 6th month ahead

        const canGoBack = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) > sixMonthsAgo;
        const canGoForward = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) < new Date(sixMonthsHence.getFullYear(), sixMonthsHence.getMonth(), 1);

        return (
            <div className="flex items-center justify-between py-2 px-1">
                <button onClick={() => onMonthChange(-1)} disabled={!canGoBack} className="p-2 rounded-full hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed">&lt;</button>
                <span className="text-lg font-semibold">{dateFormat.format(currentDate)}</span>
                <button onClick={() => onMonthChange(1)} disabled={!canGoForward} className="p-2 rounded-full hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed">&gt;</button>
            </div>
        );
    };

    const renderDaysOfWeek = () => {
        const days = ['一', '二', '三', '四', '五', '六', '日'];
        return (
            <div className="grid grid-cols-7 text-center text-sm text-slate-500">
                {days.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startDate = new Date(monthStart);
        let startDayOfWeek = startDate.getDay() - 1; // 0 = Monday, ..., 6 = Sunday
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Adjust for Sunday
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        const rows = [];
        let days = [];
        let day = new Date(startDate);
        
        while (rows.length < 6) {
            for (let i = 0; i < 7; i++) {
                // CRITICAL FIX: Manually construct date string to avoid timezone issues.
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const date = String(day.getDate()).padStart(2, '0');
                const dayStr = `${year}-${month}-${date}`;

                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();

                const isWorkDay = workDays.has(dayStr);
                const isSelected = selectedDays.has(dayStr);

                let cellClasses = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ';

                if (isScheduling) {
                    if (isSelected) {
                        cellClasses += 'bg-amber-300 text-amber-800 ring-2 ring-amber-400 ';
                    } else {
                        cellClasses += 'hover:bg-slate-200 ';
                    }
                } else {
                    if (isWorkDay) {
                        cellClasses += 'bg-sky-100 text-sky-700 hover:bg-sky-200 ';
                    } else {
                        cellClasses += 'hover:bg-slate-100 ';
                    }
                }

                if (isToday) {
                    cellClasses += 'border-2 border-sky-500 ';
                }
                 if (!isCurrentMonth) {
                    cellClasses += 'text-slate-300 ';
                } else {
                    cellClasses += 'text-slate-700 ';
                }

                days.push(
                    <div
                        key={dayStr}
                        className={`p-1 text-center h-12 flex items-center justify-center ${
                            isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        onClick={() => isCurrentMonth && onDateClick(dayStr)}
                    >
                        <span className={`${cellClasses} ${isScheduling && isCurrentMonth ? 'jiggle-animation' : ''}`}>
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
        <div className="bg-white border border-slate-200 rounded-lg">
            <style>{`
                @keyframes jiggle {
                    0%, 100% { transform: rotate(-1.5deg); }
                    50% { transform: rotate(1.5deg); }
                }
                .jiggle-animation {
                    animation: jiggle 0.4s infinite ease-in-out;
                }
            `}</style>
            {renderHeader()}
            {renderDaysOfWeek()}
            {renderCells()}
        </div>
    );
};

export default Calendar;