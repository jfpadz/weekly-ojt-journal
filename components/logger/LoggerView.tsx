import { Sun, Sunset, ArrowLeft } from 'lucide-react';
import type { LogEntry } from '@/types';
import { isSameDay } from '@/lib/utils';
import { TimeCard } from './TimeCard';

type LoggerViewProps = {
  date: Date;
  log: LogEntry;
  onPunch: (type: keyof LogEntry) => void;
  onClear: (type: keyof LogEntry) => void;
  onBack: () => void;
  onGoToReport: () => void;
};

export function LoggerView({ 
  date, 
  log, 
  onPunch, 
  onClear, 
  onBack, 
  onGoToReport 
}: LoggerViewProps) {
  // Check if the selected date is strictly Today
  const isToday = isSameDay(date, new Date());

  return (
    <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center text-sm text-slate-400 hover:text-indigo-600 transition-colors group"
        >
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        {(log.pmOut || log.activity) && (
          <button 
            onClick={onGoToReport} 
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {isToday ? "Edit Report →" : "View Report →"}
          </button>
        )}
      </div>

      {/* Date Display */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {date.toLocaleDateString('en-US', { weekday: 'long' })}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-slate-500">
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          {!isToday && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">
              Read Only
            </span>
          )}
        </div>
      </div>

      {/* Time Sessions */}
      <div className="space-y-6">
        {/* Morning Session */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-amber-500">
            <Sun size={20} />
            <h3 className="font-semibold text-slate-700">Morning Session</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TimeCard 
              label="Time In" 
              value={log.amIn} 
              active={!log.amIn} 
              onClick={() => onPunch('amIn')} 
              onClear={() => onClear('amIn')} 
              isReadOnly={!isToday} 
            />
            <TimeCard 
              label="Time Out" 
              value={log.amOut} 
              active={!!log.amIn && !log.amOut} 
              onClick={() => onPunch('amOut')} 
              onClear={() => onClear('amOut')} 
              isReadOnly={!isToday} 
            />
          </div>
        </div>

        {/* Afternoon Session */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-indigo-500">
            <Sunset size={20} />
            <h3 className="font-semibold text-slate-700">Afternoon Session</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TimeCard 
              label="Time In" 
              value={log.pmIn} 
              active={!!log.amOut && !log.pmIn} 
              onClick={() => onPunch('pmIn')} 
              onClear={() => onClear('pmIn')} 
              isReadOnly={!isToday} 
            />
            <TimeCard 
              label="Time Out" 
              value={log.pmOut} 
              active={!!log.pmIn && !log.pmOut} 
              onClick={() => onPunch('pmOut')} 
              onClear={() => onClear('pmOut')} 
              isLastStep={true} 
              isReadOnly={!isToday} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
