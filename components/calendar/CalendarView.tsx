import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LogEntry } from '@/types';
import { getDaysInMonth, getFirstDayOfMonth, isSameDay, formatTime } from '@/lib/utils';

type CalendarViewProps = {
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  onDateClick: (day: number) => void;
  logs: Record<string, LogEntry>;
};

export function CalendarView({ 
  currentDate, 
  prevMonth, 
  nextMonth, 
  onDateClick, 
  logs 
}: CalendarViewProps) {
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/50"></div>);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const dateKey = dateObj.toDateString();
    const log = logs[dateKey];
    const isToday = isSameDay(dateObj, new Date());
    const isPast = dateObj < today;
    const isFuture = dateObj > today && !isToday;

    // Status indicator dot
    let statusDot = null;
    if (log?.pmOut && (log?.activity || log?.accomplished)) {
      statusDot = <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Complete"></div>;
    } else if (log?.amIn) {
      statusDot = <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white" title="In Progress"></div>;
    }

    days.push(
      <button
        key={d}
        onClick={() => onDateClick(d)}
        // Disable if Future OR (Past AND Empty)
        // This allows clicking past dates ONLY if they have data (to view them)
        disabled={isFuture || (isPast && !log?.amIn)}
        className={`
          relative h-24 sm:h-32 border-t border-r border-slate-100 p-2 text-left transition-all duration-200 group
          ${isFuture || (isPast && !log?.amIn)
            ? 'bg-slate-50 opacity-60 cursor-not-allowed'
            : `hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${isToday ? 'bg-indigo-50/40' : 'bg-white'}`
          }
        `}
      >
        <span className={`
          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
          ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}
        `}>
          {d}
        </span>
        <div className="absolute top-3 right-3 flex space-x-1">{statusDot}</div>
        <div className="mt-2 space-y-1">
          {log?.amIn && <div className="text-[10px] text-slate-400 font-mono pl-1 border-l-2 border-indigo-200">IN {formatTime(log.amIn)}</div>}
          {log?.pmOut && <div className="text-[10px] text-slate-400 font-mono pl-1 border-l-2 border-emerald-200">OUT {formatTime(log.pmOut)}</div>}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-l border-slate-100">{days}</div>
    </div>
  );
}
