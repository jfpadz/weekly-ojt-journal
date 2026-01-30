'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sun, 
  Sunset, 
  BookOpen, 
  ArrowLeft,
  Loader2,
  Layout,
  X,
  Trash2,
  Lock
} from 'lucide-react';
import type { LogEntry, ViewType } from '@/types';
import { isSameDay } from '@/lib/utils';
import { useLogs } from '@/hooks/useLogs';
import { SyncStatusView } from '@/components/sync/SyncStatusView';
import { CalendarView } from '@/components/calendar/CalendarView';

// --- Main Component ---

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewType>('calendar');

  // Use the custom hook for logs management
  const { 
    logs, 
    isLoading, 
    syncStatus, 
    handleTimePunch, 
    handleTimeClear, 
    handleReportSubmit 
  } = useLogs();

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goHome = () => {
    setSelectedDate(null);
    setView('calendar');
  };

  // Interaction Handlers
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    // Check flow status
    const dateKey = clickedDate.toDateString();
    const log = logs[dateKey] || {};
    
    // If afternoon is clocked out but report is missing, go to report
    if (log.pmOut && (!log.activity && !log.accomplished)) {
      setView('report');
    } else {
      setView('logger');
    }
  };

  // Wrapper handlers that pass selectedDate
  const onTimePunch = (type: keyof LogEntry) => {
    handleTimePunch(selectedDate, type, () => setView('report'));
  };

  const onTimeClear = (type: keyof LogEntry) => {
    handleTimeClear(selectedDate, type);
  };

  const onReportSubmit = (formData: { activity: string; accomplished: string } | null) => {
    handleReportSubmit(selectedDate, formData, {
      onSyncStart: () => setView('syncing'),
      onSuccess: () => setView('calendar'),
      onError: () => setView('report'),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden sm:max-w-4xl sm:my-8 sm:min-h-0 sm:rounded-3xl border border-slate-100">
        
        {/* Header */}
        <header className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
               <BookOpen size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Journal</h1>
               <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Professional Log</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {isLoading && <Loader2 className="animate-spin text-slate-300" size={16} />}
             <div className="text-sm font-medium text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
             </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-0 sm:p-2">
          {view === 'calendar' && (
            <CalendarView 
              currentDate={currentDate} 
              prevMonth={prevMonth} 
              nextMonth={nextMonth} 
              onDateClick={handleDateClick}
              logs={logs}
            />
          )}

          {view === 'logger' && selectedDate && (
            <LoggerView 
              date={selectedDate} 
              log={logs[selectedDate.toDateString()] || {}} 
              onPunch={onTimePunch}
              onClear={onTimeClear} 
              onBack={goHome}
              onGoToReport={() => setView('report')}
            />
          )}

          {view === 'report' && selectedDate && (
            <FormView 
              title="Daily Accomplishment"
              subtitle="Fill in your activity and milestones for the day."
              icon={<CheckCircle2 className="text-emerald-500" />}
              onSubmit={onReportSubmit}
              existingData={{
                  activity: logs[selectedDate.toDateString()]?.activity || '',
                  accomplished: logs[selectedDate.toDateString()]?.accomplished || ''
              }}
              onCancel={() => setView('logger')}
              // Report is editable if it's today
              isReadOnly={!isSameDay(selectedDate, new Date())}
            />
          )}

          {view === 'syncing' && (
             <SyncStatusView status={syncStatus} />
          )}
        </main>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function LoggerView({ date, log, onPunch, onClear, onBack, onGoToReport }: any) {
  // Check if the selected date is strictly Today
  const isToday = isSameDay(date, new Date());

  return (
    <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-sm text-slate-400 hover:text-indigo-600 transition-colors group">
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        {(log.pmOut || log.activity) && (
            <button onClick={onGoToReport} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                {isToday ? "Edit Report →" : "View Report →"}
            </button>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{date.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
        <div className="flex items-center gap-3">
           <p className="text-slate-500">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
           {!isToday && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">Read Only</span>}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-amber-500">
            <Sun size={20} /><h3 className="font-semibold text-slate-700">Morning Session</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TimeCard label="Time In" value={log.amIn} active={!log.amIn} onClick={() => onPunch('amIn')} onClear={() => onClear('amIn')} isReadOnly={!isToday} />
            <TimeCard label="Time Out" value={log.amOut} active={log.amIn && !log.amOut} onClick={() => onPunch('amOut')} onClear={() => onClear('amOut')} isReadOnly={!isToday} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-indigo-500">
            <Sunset size={20} /><h3 className="font-semibold text-slate-700">Afternoon Session</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <TimeCard label="Time In" value={log.pmIn} active={log.amOut && !log.pmIn} onClick={() => onPunch('pmIn')} onClear={() => onClear('pmIn')} isReadOnly={!isToday} />
             <TimeCard label="Time Out" value={log.pmOut} active={log.pmIn && !log.pmOut} onClick={() => onPunch('pmOut')} onClear={() => onClear('pmOut')} isLastStep={true} isReadOnly={!isToday} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeCard({ label, value, active, onClick, onClear, isLastStep, isReadOnly }: any) {
  const isTimeLocked = value ? (new Date().getTime() - new Date(value).getTime() > 3600000) : false;
  // Strictly lock interactions if it's not Today OR if time is locked (older than 1h)
  const isInteractionDisabled = isReadOnly || isTimeLocked;

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
        ${value 
          ? 'bg-slate-50 border-slate-200' 
          : active && !isReadOnly
            ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-md cursor-pointer' 
            : 'bg-slate-50/50 border-slate-100 opacity-60'
        }
    `} onClick={(!value && active && !isReadOnly) ? onClick : undefined}>
      
      {/* Undo Button (Only if value exists AND editable) */}
      {value && !isInteractionDisabled && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-2 -right-2 p-1 bg-white border border-red-100 rounded-full shadow-sm text-red-400 hover:text-red-600 hover:bg-red-50 z-10"
            title="Clear this time"
          >
              <X size={14} />
          </button>
      )}

      {/* Lock Indicator */}
      {value && isInteractionDisabled && (
        <div className="absolute top-2 right-2 text-slate-300" title="Locked">
           <Lock size={12} />
        </div>
      )}

      <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">{label}</span>
      {value ? (
        <span className="text-xl font-mono font-semibold text-slate-700 flex items-center">
          {formatTime(value)}
          <CheckCircle2 size={16} className="ml-2 text-emerald-500" />
        </span>
      ) : (
        <span className={`text-sm font-medium ${active && !isReadOnly ? 'text-indigo-600' : 'text-slate-300'}`}>
           {active && !isReadOnly ? (isLastStep ? "Finish Day" : "Punch Now") : "Waiting..."}
        </span>
      )}
    </div>
  );
}

function FormView({ title, subtitle, icon, onSubmit, existingData, onCancel, theme = 'indigo', isReadOnly }: any) {
  const [formData, setFormData] = useState(existingData || { activity: '', accomplished: '' });

  const handleChange = (field: string, value: string) => {
    if (isReadOnly) return;
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadOnly) onSubmit(formData);
  };
  
  const handleClear = () => {
      if(!isReadOnly && confirm("Clear current report text?")) {
          setFormData({ activity: '', accomplished: '' });
      }
  }

  const themeClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col min-h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl bg-indigo-100`}>{icon}</div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
             </div>
             <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600">
                {isReadOnly ? "Back" : "Cancel"}
             </button>
        </div>
        <div className="flex items-center gap-2 mb-6 ml-1">
            <p className="text-slate-500">{subtitle}</p>
            {isReadOnly && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Read Only</span>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
               <div className="bg-indigo-100/50 px-4 py-3 border-b border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <Layout size={14} className="mr-2 text-indigo-500"/> Activity
                  </label>
               </div>
               <textarea
                 className="w-full h-48 md:h-64 p-4 focus:ring-2 focus:ring-inset focus:ring-indigo-100 focus:bg-indigo-50/20 border-none resize-none text-slate-700 text-sm leading-relaxed placeholder:text-slate-300 outline-none transition-colors"
                 placeholder={isReadOnly ? "No activity recorded." : "- List your tasks here..."}
                 value={formData.activity}
                 onChange={(e) => handleChange('activity', e.target.value)}
                 readOnly={isReadOnly}
               />
            </div>
            <div className="flex flex-col">
               <div className="bg-indigo-100/50 px-4 py-3 border-b border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <CheckCircle2 size={14} className="mr-2 text-emerald-500"/> Accomplished (Milestone)
                  </label>
               </div>
               <textarea
                 className="w-full h-48 md:h-64 p-4 focus:ring-2 focus:ring-inset focus:ring-emerald-100 focus:bg-emerald-50/20 border-none resize-none text-slate-700 text-sm leading-relaxed placeholder:text-slate-300 outline-none transition-colors"
                 placeholder={isReadOnly ? "No milestones recorded." : "- What was completed?"}
                 value={formData.accomplished}
                 onChange={(e) => handleChange('accomplished', e.target.value)}
                 readOnly={isReadOnly}
               />
            </div>
          </div>
          
          {!isReadOnly && (
            <div className="mt-6 flex justify-between items-center">
               <button type="button" onClick={handleClear} className="flex items-center text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} className="mr-2" /> Clear Report
               </button>
              <button
                type="submit"
                // @ts-ignore
                className={`px-8 py-3 rounded-full text-white font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700`}
              >
                Save Report
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}