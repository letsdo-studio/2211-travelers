'use client';

import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'time' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
}

interface EditModalProps {
  title: string;
  fields: Field[];
  data: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function EditModal({ title, fields, data, onSave, onDelete, onClose }: EditModalProps) {
  const [form, setForm] = useState<Record<string, string>>(data);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1.5">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={form[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={form[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-card-border flex gap-2 safe-bottom">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-card-border text-sm font-medium hover:bg-card transition-colors active:scale-95"
          >
            ביטול
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}
