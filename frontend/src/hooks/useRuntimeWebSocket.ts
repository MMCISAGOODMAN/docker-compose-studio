import { useEffect, useRef } from 'react';
import { createRuntimeWebSocket } from '@/lib/api';
import { useRuntimeStore } from '@/stores/runtime-store';
import type { ContainerInfo, ContainerStats } from '@/types';

export function useRuntimeWebSocket(deployId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const setWsConnected = useRuntimeStore((s) => s.setWsConnected);
  const setContainers = useRuntimeStore((s) => s.setContainers);
  const setStats = useRuntimeStore((s) => s.setStats);
  const appendLog = useRuntimeStore((s) => s.appendLog);
  const selectedContainerId = useRuntimeStore((s) => s.selectedContainerId);

  useEffect(() => {
    if (!deployId) return;

    const ws = createRuntimeWebSocket(deployId);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: unknown };
        switch (msg.type) {
          case 'container.status':
            setContainers((msg.payload as { containers: ContainerInfo[] }).containers);
            break;
          case 'container.stats':
            {
              const stats = msg.payload as ContainerStats;
              setStats(stats.containerId, stats);
            }
            break;
          case 'container.logs':
            appendLog(msg.payload as { containerId: string; line: string; timestamp: number });
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [deployId, setWsConnected, setContainers, setStats, appendLog]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedContainerId) return;

    ws.send(JSON.stringify({ type: 'subscribe.logs', containerId: selectedContainerId }));

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe.logs', containerId: selectedContainerId }));
      }
    };
  }, [selectedContainerId, deployId]);

  return wsRef;
}
