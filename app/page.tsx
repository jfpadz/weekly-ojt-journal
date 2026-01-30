'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  BookOpen, 
  Loader2,
  Layout,
  Trash2
} from 'lucide-react';
import type { LogEntry, ViewType } from '@/types';
import { isSameDay } from '@/lib/utils';
import { useLogs } from '@/hooks/useLogs';
import { SyncStatusView } from '@/components/sync/SyncStatusView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LoggerView } from '@/components/logger/LoggerView';

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