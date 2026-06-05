import { useState } from 'react';
import { X } from 'lucide-react';

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName?: string;
}

export default function SaveTemplateDialog({ open, onClose, onSave, defaultName = '' }: SaveTemplateDialogProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-dcs-border bg-dcs-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dcs-text">Save as Template</h3>
          <button type="button" onClick={onClose} className="text-dcs-muted hover:text-dcs-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Template Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dev Stack"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spring Boot + PostgreSQL + Redis"
              className="input-field min-h-[72px] resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-dcs-muted hover:text-dcs-text">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-dcs-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-dcs-accentHover disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
