'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LogEntry, ViewType, SyncStatus } from '@/types';

type UseLogsReturn = {
  logs: Record<string, LogEntry>;
  isLoading: boolean;
  syncStatus: SyncStatus;
  updateLog: (selectedDate: Date | null, key: keyof LogEntry, value: any) => LogEntry | undefined;
  handleTimePunch: (
    selectedDate: Date | null,
    type: keyof LogEntry,
    onAfterPmOut?: () => void
  ) => Promise<void>;
  handleTimeClear: (selectedDate: Date | null, type: keyof LogEntry) => Promise<void>;
  handleReportSubmit: (
    selectedDate: Date | null,
    formData: { activity: string; accomplished: string } | null,
    callbacks: {
      onSyncStart: () => void;
      onSuccess: () => void;
      onError: () => void;
    }
  ) => Promise<void>;
};

export function useLogs(): UseLogsReturn {
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ db: 'waiting', sheet: 'waiting' });

  // --- Load Data on Mount ---
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
              accomplished: row.accomplished,
            };
          });
          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  // --- Update local log state ---
  const updateLog = useCallback(
    (selectedDate: Date | null, key: keyof LogEntry, value: any): LogEntry | undefined => {
      if (!selectedDate) return;
      const dateKey = selectedDate.toDateString();
      
      let updatedLog: LogEntry;
      
      setLogs((prev) => {
        const currentLog = prev[dateKey] || {
          amIn: null,
          amOut: null,
          pmIn: null,
          pmOut: null,
          activity: '',
          accomplished: '',
        };

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          updatedLog = { ...currentLog, ...value };
        } else {
          updatedLog = { ...currentLog, [key]: value };
        }

        return { ...prev, [dateKey]: updatedLog };
      });

      return undefined; // Return handled via state
    },
    []
  );

  // --- Save to backend ---
  const saveToBackend = useCallback(async (selectedDate: Date | null, payload: any) => {
    if (!selectedDate) return;
    try {
      await fetch('/api/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateKey: selectedDate.toDateString(),
          ...payload,
        }),
      });
    } catch (e) {
      console.error('Save failed', e);
    }
  }, []);

  // --- Time Punch Handler ---
  const handleTimePunch = useCallback(
    async (selectedDate: Date | null, type: keyof LogEntry, onAfterPmOut?: () => void) => {
      const now = new Date().toISOString();
      updateLog(selectedDate, type, now);
      saveToBackend(selectedDate, { [type]: now });

      if (type === 'pmOut' && onAfterPmOut) {
        setTimeout(onAfterPmOut, 800);
      }
    },
    [updateLog, saveToBackend]
  );

  // --- Time Clear Handler ---
  const handleTimeClear = useCallback(
    async (selectedDate: Date | null, type: keyof LogEntry) => {
      if (!confirm('Are you sure you want to clear this time?')) return;

      updateLog(selectedDate, type, null);
      saveToBackend(selectedDate, { [type]: null });
    },
    [updateLog, saveToBackend]
  );

  // --- Report Submit Handler ---
  const handleReportSubmit = useCallback(
    async (
      selectedDate: Date | null,
      formData: { activity: string; accomplished: string } | null,
      callbacks: {
        onSyncStart: () => void;
        onSuccess: () => void;
        onError: () => void;
      }
    ) => {
      if (!selectedDate) return;

      const finalData = formData || { activity: '', accomplished: '' };
      const dateKey = selectedDate.toDateString();

      // Update local state
      setLogs((prev) => {
        const currentLog = prev[dateKey] || {};
        return { ...prev, [dateKey]: { ...currentLog, ...finalData } };
      });

      // Trigger sync UI
      callbacks.onSyncStart();
      setSyncStatus({ db: 'loading', sheet: 'loading' });

      try {
        // Get updated log for submission
        const currentLog = logs[dateKey] || {};
        const fullLog = { ...currentLog, ...finalData };

        const response = await fetch('/api/save-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateKey: selectedDate.toDateString(),
            ...fullLog,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSyncStatus({ db: 'success', sheet: 'success' });
          await new Promise((r) => setTimeout(r, 1500));
          callbacks.onSuccess();
        } else {
          alert('Error saving: ' + result.error);
          callbacks.onError();
        }
      } catch (e) {
        alert('Network Error');
        callbacks.onError();
      }
    },
    [logs]
  );

  return {
    logs,
    isLoading,
    syncStatus,
    updateLog,
    handleTimePunch,
    handleTimeClear,
    handleReportSubmit,
  };
}
