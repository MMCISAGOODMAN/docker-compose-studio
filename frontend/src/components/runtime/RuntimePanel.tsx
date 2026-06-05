import { useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Container,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useRuntimeStore } from '@/stores/runtime-store';
import { useRuntimeWebSocket } from '@/hooks/useRuntimeWebSocket';
import { api } from '@/lib/api';

export default function RuntimePanel() {
  const composeYaml = useProjectStore((s) => s.composeYaml);
  const projectName = useProjectStore((s) => s.projectName);
  const validation = useProjectStore((s) => s.validation);

  const deployId = useRuntimeStore((s) => s.deployId);
  const deployStatus = useRuntimeStore((s) => s.deployStatus);
  const deployError = useRuntimeStore((s) => s.deployError);
  const dockerConnected = useRuntimeStore((s) => s.dockerConnected);
  const containers = useRuntimeStore((s) => s.containers);
  const stats = useRuntimeStore((s) => s.stats);
  const logs = useRuntimeStore((s) => s.logs);
  const selectedContainerId = useRuntimeStore((s) => s.selectedContainerId);
  const wsConnected = useRuntimeStore((s) => s.wsConnected);

  const logRef = useRef<HTMLDivElement>(null);

  useRuntimeWebSocket(deployId);

  useEffect(() => {
    api.dockerHealth().then((h) => useRuntimeStore.getState().setDockerConnected(h.connected)).catch(() => {
      useRuntimeStore.getState().setDockerConnected(false);
    });
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDeploy = async () => {
    const store = useRuntimeStore.getState();
    if (validation && !validation.valid) {
      store.setDeployError('Fix validation errors before deploying');
      return;
    }
    store.setDeployStatus('deploying');
    store.setDeployError(null);
    store.clearLogs();

    try {
      const result = await api.deploy(composeYaml, projectName);
      store.setDeployId(result.deployId);
      store.setComposeProjectName(result.composeProjectName);
      store.setDeployStatus('running');
    } catch (err) {
      store.setDeployStatus('failed');
      store.setDeployError(err instanceof Error ? err.message : 'Deploy failed');
    }
  };

  const handleStop = async () => {
    if (!deployId) return;
    const store = useRuntimeStore.getState();
    store.setDeployStatus('stopping');

    try {
      await api.stop(deployId);
      store.reset();
    } catch (err) {
      store.setDeployStatus('failed');
      store.setDeployError(err instanceof Error ? err.message : 'Stop failed');
    }
  };

  const filteredLogs = selectedContainerId
    ? logs.filter((l) => l.containerId === selectedContainerId)
    : logs;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-dcs-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dockerConnected === null ? (
              <span className="text-xs text-dcs-muted">Checking Docker...</span>
            ) : dockerConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Activity className="h-3 w-3" /> Docker connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" /> Docker unavailable
              </span>
            )}
            {deployStatus === 'running' && (
              <span className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {wsConnected ? 'Live' : 'Reconnecting...'}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {(deployStatus === 'running' || deployStatus === 'stopping') ? (
              <button
                type="button"
                onClick={handleStop}
                disabled={deployStatus === 'stopping'}
                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {deployStatus === 'stopping' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeploy}
                disabled={deployStatus === 'deploying' || !dockerConnected || (validation !== null && !validation.valid)}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {deployStatus === 'deploying' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Deploy
              </button>
            )}
          </div>
        </div>

        {deployError && (
          <div className="rounded-md bg-red-500/10 px-2 py-1.5 text-xs text-red-400">{deployError}</div>
        )}

        {!dockerConnected && dockerConnected !== null && (
          <p className="text-xs text-dcs-muted">
            Start backend with <code className="text-dcs-accent">DOCKER_ENABLED=true</code> and mount Docker socket.
          </p>
        )}
      </div>

      {/* Containers */}
      <div className="border-b border-dcs-border p-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-dcs-muted uppercase tracking-wider">
          <Container className="h-3.5 w-3.5" /> Containers
        </h3>
        {containers.length === 0 ? (
          <p className="text-xs text-dcs-muted">
            {deployStatus === 'running' ? 'Waiting for containers...' : 'Deploy to see container status'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {containers.map((c) => {
              const s = stats[c.id];
              const isSelected = selectedContainerId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => useRuntimeStore.getState().setSelectedContainer(isSelected ? null : c.id)}
                  className={`w-full rounded-lg border p-2 text-left transition-colors ${
                    isSelected ? 'border-dcs-accent bg-dcs-accent/10' : 'border-dcs-border bg-dcs-bg hover:border-dcs-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-dcs-text">{c.service || c.name}</span>
                    <StatusBadge state={c.state} health={c.health} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-dcs-muted">{c.image}</div>
                  {s && c.state === 'running' && (
                    <div className="mt-1 flex gap-3 text-xs text-dcs-muted">
                      <span>CPU {s.cpuPercent}%</span>
                      <span>MEM {s.memoryUsageMb}/{s.memoryLimitMb} MB</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="flex flex-1 flex-col min-h-0 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-dcs-muted uppercase tracking-wider">
            Logs {selectedContainerId ? `(${containers.find((c) => c.id === selectedContainerId)?.service ?? 'selected'})` : '(all)'}
          </h3>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => useRuntimeStore.getState().clearLogs()}
              className="text-xs text-dcs-muted hover:text-dcs-text"
            >
              Clear
            </button>
          )}
        </div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto rounded-lg border border-dcs-border bg-dcs-bg p-2 font-mono text-xs leading-relaxed"
        >
          {filteredLogs.length === 0 ? (
            <span className="text-dcs-muted">
              {selectedContainerId ? 'Waiting for log stream...' : 'Select a container to stream logs'}
            </span>
          ) : (
            filteredLogs.map((l, i) => (
              <div key={`${l.timestamp}-${i}`} className="text-dcs-text whitespace-pre-wrap break-all">
                {l.line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ state, health }: { state: string; health: string }) {
  const color =
    health === 'healthy' || state === 'running'
      ? 'bg-emerald-500/20 text-emerald-400'
      : state === 'exited'
        ? 'bg-dcs-border text-dcs-muted'
        : health === 'unhealthy'
          ? 'bg-red-500/20 text-red-400'
          : 'bg-yellow-500/20 text-yellow-400';

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      {health !== 'none' && health !== 'running' ? health : state}
    </span>
  );
}
