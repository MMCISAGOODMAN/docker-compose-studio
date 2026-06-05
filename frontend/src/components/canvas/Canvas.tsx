import { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type NodeTypes,
  type OnNodeDrag,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ServiceNodeComponent from './ServiceNode';
import { useProjectStore } from '@/stores/project-store';
import { useThemeStore } from '@/stores/theme-store';

const nodeTypes: NodeTypes = {
  serviceNode: ServiceNodeComponent,
};

export default function Canvas() {
  const storeNodes = useProjectStore((s) => s.nodes);
  const storeEdges = useProjectStore((s) => s.edges);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const setNodes = useProjectStore((s) => s.setNodes);
  const setEdges = useProjectStore((s) => s.setEdges);
  const theme = useThemeStore((s) => s.theme);

  const dotColor = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue('--dcs-canvas-dots').trim() || '#2d3a4f',
    [theme]
  );
  const minimapMask = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue('--dcs-minimap-mask').trim() || 'rgba(15, 20, 25, 0.8)',
    [theme]
  );

  const [nodes, setLocalNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => {
    setLocalNodes(storeNodes as Node[]);
  }, [storeNodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(storeEdges);
  }, [storeEdges, setLocalEdges]);

  const onConnect = (connection: Connection) => {
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'dependency' as const,
    };
    const updated = addEdge(newEdge, storeEdges);
    setEdges(updated);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNode(node.id);
  const onPaneClick = () => setSelectedNode(null);

  const onNodeDragStop: OnNodeDrag = (_, node) => {
    const updated = storeNodes.map((n) =>
      n.id === node.id ? { ...n, position: node.position } : n
    );
    setNodes(updated);
  };

  const onNodesDelete = (deleted: Node[]) => {
    for (const node of deleted) {
      useProjectStore.getState().removeNode(node.id);
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        className="bg-dcs-bg"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={dotColor} />
        <Controls />
        <MiniMap nodeColor="var(--dcs-accent)" maskColor={minimapMask} className="!bg-dcs-surface" />
      </ReactFlow>
    </div>
  );
}
