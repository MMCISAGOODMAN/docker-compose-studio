import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { ValidationIssue } from '@/types';

interface ValidationPanelProps {
  validation: import('@/types').ValidationResult | null;
  onIssueClick?: (issue: ValidationIssue) => void;
}

export default function ValidationPanel({ validation, onIssueClick }: ValidationPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (!validation) return null;

  const { errors, warnings, valid } = validation;
  const total = errors.length + warnings.length;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 border-b border-dcs-border bg-emerald-500/10 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="text-xs text-emerald-400">Compose is valid — ready to deploy</span>
      </div>
    );
  }

  return (
    <div className="border-b border-dcs-border bg-dcs-bg">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-dcs-surface/50"
      >
        <div className="flex items-center gap-2">
          {valid ? (
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs font-medium ${valid ? 'text-yellow-400' : 'text-red-400'}`}>
            {errors.length > 0
              ? `${errors.length} error${errors.length > 1 ? 's' : ''}`
              : ''}
            {errors.length > 0 && warnings.length > 0 ? ', ' : ''}
            {warnings.length > 0
              ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`
              : ''}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-dcs-muted" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-dcs-muted" />
        )}
      </button>

      {expanded && (
        <div className="max-h-36 overflow-y-auto px-3 pb-2 space-y-1">
          {errors.map((issue) => (
            <IssueRow key={`e-${issue.code}-${issue.path}`} issue={issue} onClick={onIssueClick} />
          ))}
          {warnings.map((issue) => (
            <IssueRow key={`w-${issue.code}-${issue.path}`} issue={issue} onClick={onIssueClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({
  issue,
  onClick,
}: {
  issue: ValidationIssue;
  onClick?: (issue: ValidationIssue) => void;
}) {
  const isError = issue.severity === 'error';
  return (
    <button
      type="button"
      onClick={() => onClick?.(issue)}
      className="flex w-full items-start gap-2 rounded px-1.5 py-1 text-left hover:bg-dcs-surface/80"
    >
      {isError ? (
        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
      ) : (
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-yellow-400" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-dcs-text">{issue.message}</p>
        {issue.path && (
          <p className="truncate font-mono text-[10px] text-dcs-muted">{issue.path}</p>
        )}
      </div>
    </button>
  );
}
