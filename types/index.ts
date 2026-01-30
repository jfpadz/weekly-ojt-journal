// --- Core Types ---

export type LogEntry = {
  amIn?: string | null;
  amOut?: string | null;
  pmIn?: string | null;
  pmOut?: string | null;
  activity?: string;
  accomplished?: string;
};

export type ViewType = 'calendar' | 'logger' | 'report' | 'syncing';

export type SyncStatus = {
  db: 'waiting' | 'loading' | 'success' | 'error';
  sheet: 'waiting' | 'loading' | 'success' | 'error';
};

// --- API Response Types ---

export type LogRecord = {
  date_key: string;
  am_in: string | null;
  am_out: string | null;
  pm_in: string | null;
  pm_out: string | null;
  activity: string | null;
  accomplished: string | null;
};

export type SaveLogPayload = {
  dateKey: string;
  amIn?: string | null;
  amOut?: string | null;
  pmIn?: string | null;
  pmOut?: string | null;
  activity?: string;
  accomplished?: string;
};
