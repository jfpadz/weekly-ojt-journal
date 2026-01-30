'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  BookOpen, 
  Loader2
} from 'lucide-react';
import type { LogEntry, ViewType } from '@/types';
import { isSameDay } from '@/lib/utils';
import { useLogs } from '@/hooks/useLogs';
import { SyncStatusView } from '@/components/sync/SyncStatusView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LoggerView } from '@/components/logger/LoggerView';
import { FormView } from '@/components/report/FormView';

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