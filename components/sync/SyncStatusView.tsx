import { Database, Sheet, CloudCog, Loader2, CheckCircle2 } from 'lucide-react';
import type { SyncStatus } from '@/types';

type SyncStatusViewProps = {
  status: SyncStatus;
};

export function SyncStatusView({ status }: SyncStatusViewProps) {
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
  );
}
