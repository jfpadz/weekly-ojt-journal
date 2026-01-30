import { CheckCircle2, X, Lock } from 'lucide-react';
import { formatTime } from '@/lib/utils';

type TimeCardProps = {
  label: string;
  value: string | null | undefined;
  active: boolean;
  onClick: () => void;
  onClear: () => void;
  isLastStep?: boolean;
  isReadOnly?: boolean;
};

export function TimeCard({ 
  label, 
  value, 
  active, 
  onClick, 
  onClear, 
  isLastStep = false, 
  isReadOnly = false 
}: TimeCardProps) {
  const isTimeLocked = value ? (new Date().getTime() - new Date(value).getTime() > 3600000) : false;
  // Strictly lock interactions if it's not Today OR if time is locked (older than 1h)
  const isInteractionDisabled = isReadOnly || isTimeLocked;

  return (
    <div 
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
        ${value
          ? 'bg-slate-50 border-slate-200'
          : active && !isReadOnly
            ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-md cursor-pointer'
            : 'bg-slate-50/50 border-slate-100 opacity-60'
        }
      `} 
      onClick={(!value && active && !isReadOnly) ? onClick : undefined}
    >
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
