import { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/catalog';

interface CustomServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: { name: string; description: string; image: string; category: string; ports: string }) => void;
  initial?: { name: string; description: string; image: string; category: string; ports: string };
}

export default function CustomServiceDialog({ open, onClose, onSave, initial }: CustomServiceDialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'custom');
  const [ports, setPorts] = useState(initial?.ports ?? '');

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim() || !image.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), image: image.trim(), category, ports: ports.trim() });
    if (!initial) {
      setName('');
      setDescription('');
      setImage('');
      setPorts('');
      setCategory('custom');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-dcs-border bg-dcs-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dcs-text">
            {initial ? 'Update Custom Service' : 'Create Custom Service'}
          </h3>
          <button type="button" onClick={onClose} className="text-dcs-muted hover:text-dcs-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Service Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My API" className="input-field" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Docker Image</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="myorg/myapp:latest" className="input-field font-mono text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Ports (host:container)</label>
            <input value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="8080:8080, 3000:3000" className="input-field font-mono text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {Object.entries({ ...CATEGORY_LABELS, custom: 'Custom' }).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dcs-muted">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="input-field" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-dcs-muted hover:text-dcs-text">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !image.trim()}
            className="rounded-lg bg-dcs-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-dcs-accentHover disabled:opacity-50"
          >
            Save Service
          </button>
        </div>
      </div>
    </div>
  );
}
