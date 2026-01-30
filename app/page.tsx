'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sun, 
  Sunset, 
  BookOpen, 
  ArrowLeft,
  Database,
  Sheet, 
  CloudCog,
  Loader2,
  Layout,
  X,
  Trash2,
  Lock
} from 'lucide-react';

// --- Utility Functions ---

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const formatTime = (isoString: string | null) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Types ---
type LogEntry = {
  amIn?: string | null;
  amOut?: string | null;
  pmIn?: string | null;
  pmOut?: string | null;
  activity?: string;
  accomplished?: string;
};

// --- Main Component ---

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'calendar' | 'logger' | 'report' | 'syncing'>('calendar');
  const [syncStatus, setSyncStatus] = useState({ db: 'waiting', sheet: 'waiting' });
  const [isLoading, setIsLoading] = useState(true);
  
  // Local State Store
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});

  // --- Load Data on Mount (Via API) ---
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/get-logs');
        const { data } = await res.json();
        
        if (data) {
          const formattedLogs: Record<string, LogEntry> = {};
          data.forEach((row: any) => {
            formattedLogs[row.date_key] = {
              amIn: row.am_in,
              amOut: row.am_out,
              pmIn: row.pm_in,
              pmOut: row.pm_out,
              activity: row.activity,
              accomplished: row.accomplished
            };
          });
          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Failed to load logs:", error);
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

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

  const updateLog = (key: keyof LogEntry, value: any) => {
    if (!selectedDate) return;
    const dateKey = selectedDate.toDateString();
    const currentLog = logs[dateKey] || { 
      amIn: null, amOut: null, pmIn: null, pmOut: null, 
      activity: '', accomplished: '' 
    };

    let updatedLog;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        updatedLog = { ...currentLog, ...value };
    } else {
        updatedLog = { ...currentLog, [key]: value };
    }
    
    setLogs({ ...logs, [dateKey]: updatedLog });
    return updatedLog;
  };

  // --- Save Logic (Handles Add, Update, & Delete) ---
  const saveToBackend = async (payload: any) => {
     if (!selectedDate) return;
     try {
        await fetch('/api/save-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dateKey: selectedDate.toDateString(),
                ...payload
            }),
        });
     } catch (e) { console.error("Save failed", e); }
  };

  const handleTimePunch = async (type: keyof LogEntry) => {
    const now = new Date().toISOString();
    updateLog(type, now);
    saveToBackend({ [type]: now }); // Silent Save

    if (type === 'pmOut') {
      setTimeout(() => setView('report'), 800); 
    }
  };

  const handleTimeClear = async (type: keyof LogEntry) => {
    if(!confirm("Are you sure you want to clear this time?")) return;
    
    updateLog(type, null);
    saveToBackend({ [type]: null }); // Send null to delete from DB
  };

  const handleReportSubmit = async (formData: { activity: string, accomplished: string } | null) => {
    if (!selectedDate) return;
    
    // If null, we are deleting the report
    const finalData = formData || { activity: '', accomplished: '' };

    updateLog('activity', finalData.activity);
    const dateKey = selectedDate.toDateString();
    const currentLog = logs[dateKey] || {};
    const fullLog = { ...currentLog, ...finalData };
    setLogs(prev => ({ ...prev, [dateKey]: fullLog }));
    
    setView('syncing');
    setSyncStatus({ db: 'loading', sheet: 'loading' });

    try {
      const response = await fetch('/api/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateKey: selectedDate.toDateString(),
          ...fullLog 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSyncStatus({ db: 'success', sheet: 'success' });
        await new Promise(r => setTimeout(r, 1500)); 
        setView('calendar');
      } else {
        alert('Error saving: ' + result.error);
        setView('report'); 
      }
    } catch (e) {
      alert('Network Error');
      setView('report');
    }
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
              onPunch={handleTimePunch}
              onClear={handleTimeClear} 
              onBack={goHome}
              onGoToReport={() => setView('report')}
            />
          )}

          {view === 'report' && selectedDate && (
            <FormView 
              title="Daily Accomplishment"
              subtitle="Fill in your activity and milestones for the day."
              icon={<CheckCircle2 className="text-emerald-500" />}
              onSubmit={handleReportSubmit}
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

function SyncStatusView({ status }: { status: { db: string, sheet: string } }) {
  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
       <div className="mb-8 p-4 bg-indigo-50 rounded-full">
         <CloudCog size={48} className="text-indigo-600 animate-pulse" />
       </div>
       <h2 className="text-2xl font-bold text-slate-800 mb-6">Syncing Data</h2>
       
       <div className="w-full max-w-sm space-y-4">
         {/* Database Status */}
         <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <Database size={20} className="text-slate-400" />
              <span className="font-medium text-slate-600">PostgreSQL Database</span>
            </div>
            {status.db === 'loading' && <Loader2 className="animate-spin text-indigo-600" size={20} />}
            {status.db === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
            {status.db === 'waiting' && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
         </div>

         {/* Sheet Status */}
         <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <Sheet size={20} className="text-green-600" />
              <div className="flex flex-col">
                <span className="font-medium text-slate-600">Google Sheet</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Connecting to Script...</span>
              </div>
            </div>
            {status.sheet === 'loading' && <Loader2 className="animate-spin text-green-600" size={20} />}
            {status.sheet === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
            {status.sheet === 'waiting' && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
         </div>
       </div>
    </div>
  )
}

function CalendarView({ currentDate, prevMonth, nextMonth, onDateClick, logs }: any) {
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/50"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const dateKey = dateObj.toDateString();
    const log = logs[dateKey];
    const isToday = isSameDay(dateObj, new Date());
    const isPast = dateObj < today;
    const isFuture = dateObj > today && !isToday; // strictly future
    
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
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-b border-l border-slate-100">{days}</div>
    </div>
  );
}

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