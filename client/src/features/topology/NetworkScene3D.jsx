import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useMemo } from 'react';

function deviceColor(type, failed, selected) {
  if (failed) return '#FB7185';
  if (selected) return '#34D399';
  switch (type) {
    case 'router':
      return '#60A5FA';
    case 'switch':
      return '#10B981';
    case 'server':
      return '#A7C4B8';
    case 'hub':
      return '#FBBF24';
    default:
      return '#F0FDF4';
  }
}

function DeviceMesh({ node, selected, onSelect }) {
  const pos = [
    (node.position?.x || 0) / 80,
    0.4,
    (node.position?.y || 0) / 80,
  ];
  const color = deviceColor(node.type, node.failed, selected);
  const geometry =
    node.type === 'server' ? (
      <boxGeometry args={[0.7, 0.9, 0.5]} />
    ) : node.type === 'router' ? (
      <cylinderGeometry args={[0.35, 0.45, 0.5, 6]} />
    ) : node.type === 'switch' ? (
      <boxGeometry args={[0.9, 0.25, 0.5]} />
    ) : (
      <boxGeometry args={[0.55, 0.4, 0.45]} />
    );

  return (
    <group position={pos}>
      <mesh
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(node.id);
        }}
      >
        {geometry}
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
      </mesh>
      <Html distanceFactor={10} position={[0, 0.8, 0]} center>
        <div className="rounded border border-line bg-canvas/90 px-1.5 py-0.5 text-[10px] text-ink whitespace-nowrap">
          {node.label}
          {node.failed ? ' · Failed' : ''}
        </div>
      </Html>
    </group>
  );
}

function LinkMesh({ link, nodesById, active }) {
  const a = nodesById.get(link.source);
  const b = nodesById.get(link.target);
  if (!a || !b) return null;
  const start = [(a.position?.x || 0) / 80, 0.4, (a.position?.y || 0) / 80];
  const end = [(b.position?.x || 0) / 80, 0.4, (b.position?.y || 0) / 80];
  const mid = [(start[0] + end[0]) / 2, 0.4, (start[2] + end[2]) / 2];
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.hypot(dx, dz) || 0.01;
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={mid} rotation={[0, angle, 0]}>
      <cylinderGeometry args={[active ? 0.04 : 0.02, active ? 0.04 : 0.02, len, 6]} />
      <meshStandardMaterial
        color={link.failed ? '#FB7185' : active ? '#34D399' : '#285344'}
        emissive={active ? '#047857' : '#000000'}
        emissiveIntensity={active ? 0.4 : 0}
      />
    </mesh>
  );
}

function PacketMarker({ hopAnimation, nodesById }) {
  if (!hopAnimation) return null;
  const to = nodesById.get(hopAnimation.toNodeId);
  if (!to) return null;
  const pos = [(to.position?.x || 0) / 80, 0.85, (to.position?.y || 0) / 80];
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#34D399" emissive="#10B981" emissiveIntensity={0.6} />
    </mesh>
  );
}

function Scene({ topology, hopAnimation, selectedNodeId, onSelectNode }) {
  const nodesById = useMemo(() => new Map((topology.nodes || []).map((n) => [n.id, n])), [topology]);
  const activeLinkId = useMemo(() => {
    if (!hopAnimation) return null;
    const link = (topology.links || []).find(
      (l) =>
        (l.source === hopAnimation.fromNodeId && l.target === hopAnimation.toNodeId) ||
        (l.source === hopAnimation.toNodeId && l.target === hopAnimation.fromNodeId),
    );
    return link?.id || null;
  }, [hopAnimation, topology]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 3]} intensity={0.9} />
      <gridHelper args={[20, 20, '#12352B', '#0D2620']} />
      {(topology.links || []).map((link) => (
        <LinkMesh key={link.id} link={link} nodesById={nodesById} active={link.id === activeLinkId} />
      ))}
      {(topology.nodes || []).map((node) => (
        <DeviceMesh
          key={node.id}
          node={node}
          selected={node.id === selectedNodeId}
          onSelect={onSelectNode}
        />
      ))}
      <PacketMarker hopAnimation={hopAnimation} nodesById={nodesById} />
      <OrbitControls makeDefault />
    </>
  );
}

export function NetworkScene3D({ topology, hopAnimation, selectedNodeId, onSelectNode }) {
  return (
    <div className="relative h-full w-full bg-canvas">
      <Canvas camera={{ position: [0, 6, 10], fov: 45 }}>
        <color attach="background" args={['#071A16']} />
        <Scene
          topology={topology}
          hopAnimation={hopAnimation}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line bg-surface/90 px-3 py-2 text-[11px] text-muted">
        Legend: Active · Failed · Packet marker · Orbit / zoom / pan
      </div>
    </div>
  );
}
