import { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
  safe: '#22c55e',
};

function GraphCanvas({ graph }) {
  const { fitView } = useReactFlow();
  const laidOut = useMemo(() => layoutGraph(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(laidOut.edges);

  useEffect(() => {
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
    const id = requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    return () => cancelAnimationFrame(id);
  }, [laidOut, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      minZoom={0.4}
      maxZoom={1.6}
      nodesDraggable
      panOnDrag
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#243044" gap={18} />
      <Controls />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(8,10,14,0.7)"
        nodeColor={(node) => RISK_COLORS[node.data?.tone] || '#6b7280'}
      />
    </ReactFlow>
  );
}

export default function AttackGraph({ graph, loading, error }) {
  return (
    <section className="panel graph-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Path analysis</p>
          <h2>ATTACK GRAPH</h2>
        </div>
      </div>
      {loading && !graph?.nodes?.length ? <p className="state-msg">Building graph…</p> : null}
      {error ? <p className="state-msg is-error">{error}</p> : null}
      {!graph?.nodes?.length ? (
        <p className="state-msg">No graph data available.</p>
      ) : (
        <div className="graph-canvas">
          <ReactFlowProvider>
            <GraphCanvas graph={graph} />
          </ReactFlowProvider>
        </div>
      )}
    </section>
  );
}

function layoutGraph(graph) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const incoming = new Map();
  const outgoing = new Map();
  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  });
  edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  });

  const layers = new Map();
  const queue = nodes.filter((node) => (incoming.get(node.id) || 0) === 0).map((node) => node.id);
  if (!queue.length && nodes.length) queue.push(nodes[0].id);
  queue.forEach((id) => layers.set(id, 0));
  let guard = 0;
  while (queue.length && guard < 64) {
    guard += 1;
    const id = queue.shift();
    const nextLayer = (layers.get(id) || 0) + 1;
    (outgoing.get(id) || []).forEach((target) => {
      const current = layers.has(target) ? layers.get(target) : -1;
      if (nextLayer > current && nextLayer < 12) {
        layers.set(target, nextLayer);
        queue.push(target);
      }
    });
  }

  const byLayer = {};
  nodes.forEach((node) => {
    const layer = layers.get(node.id) || 0;
    byLayer[layer] = byLayer[layer] || [];
    byLayer[layer].push(node);
  });

  const rfNodes = nodes.map((node) => {
    const layer = layers.get(node.id) || 0;
    const siblings = byLayer[layer] || [node];
    const index = siblings.findIndex((item) => item.id === node.id);
    const tone = String(node.risk || 'low').toLowerCase();
    const color = RISK_COLORS[tone] || RISK_COLORS.low;
    return {
      id: node.id,
      position: { x: layer * 210, y: index * 110 + (layer % 2) * 20 },
      data: { label: node.label || node.id, tone, attacked: node.attacked },
      className: `sp-node ${node.attacked ? 'is-attacked' : ''}`,
      style: {
        background: '#12161d',
        color: '#e8edf5',
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: node.attacked ? `0 0 0 1px ${color}` : 'none',
      },
    };
  });

  const rfEdges = edges.map((edge) => ({
    id: edge.id || `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    style: { stroke: '#64748b' },
    animated: Boolean(
      nodes.find((node) => node.id === edge.target && node.attacked) ||
        nodes.find((node) => node.id === edge.source && node.attacked),
    ),
  }));

  return { nodes: rfNodes, edges: rfEdges };
}
