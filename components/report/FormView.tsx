'use client';

import React, { useState, ReactNode } from 'react';
import { Layout, CheckCircle2, Trash2 } from 'lucide-react';

type FormData = {
  activity: string;
  accomplished: string;
};

type FormViewProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onSubmit: (formData: FormData | null) => void;
  existingData?: FormData;
  onCancel: () => void;
  isReadOnly?: boolean;
};

export function FormView({
  title,
  subtitle,
  icon,
  onSubmit,
  existingData,
  onCancel,
  isReadOnly = false,
}: FormViewProps) {
  const [formData, setFormData] = useState<FormData>(
    existingData || { activity: '', accomplished: '' }
  );

  const handleChange = (field: keyof FormData, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadOnly) onSubmit(formData);
  };

  const handleClear = () => {
    if (!isReadOnly && confirm('Clear current report text?')) {
      setFormData({ activity: '', accomplished: '' });
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col min-h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-100">{icon}</div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600">
            {isReadOnly ? 'Back' : 'Cancel'}
          </button>
        </div>

        {/* Subtitle */}
        <div className="flex items-center gap-2 mb-6 ml-1">
          <p className="text-slate-500">{subtitle}</p>
          {isReadOnly && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              Read Only
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Activity Field */}
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <div className="bg-indigo-100/50 px-4 py-3 border-b border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Layout size={14} className="mr-2 text-indigo-500" /> Activity
                </label>
              </div>
              <textarea
                className="w-full h-48 md:h-64 p-4 focus:ring-2 focus:ring-inset focus:ring-indigo-100 focus:bg-indigo-50/20 border-none resize-none text-slate-700 text-sm leading-relaxed placeholder:text-slate-300 outline-none transition-colors"
                placeholder={isReadOnly ? 'No activity recorded.' : '- List your tasks here...'}
                value={formData.activity}
                onChange={(e) => handleChange('activity', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>

            {/* Accomplished Field */}
            <div className="flex flex-col">
              <div className="bg-indigo-100/50 px-4 py-3 border-b border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <CheckCircle2 size={14} className="mr-2 text-emerald-500" /> Accomplished (Milestone)
                </label>
              </div>
              <textarea
                className="w-full h-48 md:h-64 p-4 focus:ring-2 focus:ring-inset focus:ring-emerald-100 focus:bg-emerald-50/20 border-none resize-none text-slate-700 text-sm leading-relaxed placeholder:text-slate-300 outline-none transition-colors"
                placeholder={isReadOnly ? 'No milestones recorded.' : '- What was completed?'}
                value={formData.accomplished}
                onChange={(e) => handleChange('accomplished', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="mt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} className="mr-2" /> Clear Report
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-full text-white font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700"
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
