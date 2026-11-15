import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useChartColors } from '../../lib/theme.js';
import { deviceMeta } from './NetworkKit.jsx';

const SCALE = 80;

const SCENE = {
  dark: { bg: '#050911', ground: '#0a1220', groundGlow: 0.2, grid1: '#24344f', grid2: '#131d30', ambient: 1.0, hemiSky: '#b7c9e8', hemiGround: '#1a2740', key: 1.7, link: '#4d6a99' },
  light: { bg: '#e9eff8', ground: '#f6f9fd', groundGlow: 0.75, grid1: '#b4c2d8', grid2: '#d6e0ee', ambient: 0.85, hemiSky: '#ffffff', hemiGround: '#cbd6e6', key: 1.0, link: '#a3b3cc' },
};

function pos3(node, offset) {
  return [(node.position?.x || 0) / SCALE - offset.x, 0, (node.position?.y || 0) / SCALE - offset.z];
}

/* ─────────────────────────── Device models ─────────────────────────── */

function Led({ position, color, intensity = 1.4 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.035, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} />
    </mesh>
  );
}

function DeviceModel({ type, body, trim, led }) {
  const mat = <meshStandardMaterial color={body} roughness={0.42} metalness={0.25} />;
  const trimMat = <meshStandardMaterial color={trim} roughness={0.3} metalness={0.4} />;
  switch (type) {
    case 'server':
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <group key={i} position={[0, 0.2 + i * 0.27, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.72, 0.23, 0.55]} />
                {mat}
              </mesh>
              <mesh position={[0, 0, 0.28]}>
                <boxGeometry args={[0.6, 0.05, 0.01]} />
                {trimMat}
              </mesh>
              <Led position={[0.28, 0, 0.285]} color={led} />
            </group>
          ))}
        </group>
      );
    case 'router':
      return (
        <group>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.5, 0.32, 6]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.36, 0.4, 0.04, 6]} />
            {trimMat}
          </mesh>
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, 0.62, -0.08]} castShadow>
              <cylinderGeometry args={[0.02, 0.025, 0.55, 8]} />
              {trimMat}
            </mesh>
          ))}
          {[-0.2, 0, 0.2].map((x) => (
            <Led key={x} position={[x, 0.2, 0.46]} color={led} />
          ))}
        </group>
      );
    case 'switch':
      return (
        <group>
          <mesh position={[0, 0.13, 0]} castShadow>
            <boxGeometry args={[1.05, 0.26, 0.55]} />
            {mat}
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-0.38 + i * 0.152, 0.12, 0.28]}>
              <boxGeometry args={[0.09, 0.07, 0.02]} />
              {trimMat}
            </mesh>
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Led key={i} position={[-0.38 + i * 0.152, 0.2, 0.285]} color={led} intensity={i % 2 ? 0.8 : 1.6} />
          ))}
        </group>
      );
    case 'hub':
      return (
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.46, 0.24, 8]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial color={led} emissive={led} emissiveIntensity={0.9} roughness={0.3} />
          </mesh>
        </group>
      );
    default: // pc
      return (
        <group>
          <mesh position={[0, 0.03, 0]} castShadow>
            <boxGeometry args={[0.5, 0.06, 0.34]} />
            {trimMat}
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.07, 0.3, 0.07]} />
            {trimMat}
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.86, 0.52, 0.06]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.5, 0.034]}>
            <boxGeometry args={[0.78, 0.44, 0.005]} />
            <meshStandardMaterial color={trim} emissive={led} emissiveIntensity={0.25} roughness={0.2} />
          </mesh>
        </group>
      );
  }
}

function DeviceMesh({ node, selected, offset, onSelect, c, s }) {
  const meta = deviceMeta(node.type);
  const accent = node.failed ? c.danger : c[meta.hexKey];
  const ledColor = node.failed ? c.danger : selected ? c.brand : c[meta.hexKey];
  const bodyColor = node.failed ? '#7f2a3a' : s.bg === SCENE.dark.bg ? '#3b5788' : '#ffffff';
  const trim = node.failed ? '#a23a4e' : s.bg === SCENE.dark.bg ? '#56789f' : '#d3dff0';
  const p = pos3(node, offset);
  const ring = selected ? c.brand : node.failed ? c.danger : accent;

  return (
    <group
      position={p}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(node.id);
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {/* base pad */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.78, 48]} />
        <meshStandardMaterial color={s.bg === SCENE.dark.bg ? '#0f1a2d' : '#eef3fa'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74, selected ? 0.82 : 0.78, 64]} />
        <meshBasicMaterial color={ring} transparent opacity={selected ? 0.95 : 0.55} />
      </mesh>
      <DeviceModel type={node.type} body={bodyColor} trim={trim} led={ledColor} />
      <Html distanceFactor={9} position={[0, node.type === 'server' ? 1.25 : 1.1, 0]} center zIndexRange={[20, 0]}>
        <div
          className={`pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-surface/90 px-2.5 py-1 shadow-panel backdrop-blur ${
            node.failed ? 'border-danger/50' : selected ? 'border-emerald/60' : 'border-line-strong'
          }`}
        >
          <span className={`led ${node.failed ? 'text-danger' : 'text-emerald-bright'}`} />
          <span className="font-display text-[12px] font-semibold text-ink">{node.label}</span>
          {node.failed ? <span className="font-mono text-[9px] uppercase text-danger">failed</span> : null}
        </div>
      </Html>
    </group>
  );
}

/* ─────────────────────────────── Links ─────────────────────────────── */

function Link({ link, nodesById, offset, active, c, s }) {
  const a = nodesById.get(link.source);
  const b = nodesById.get(link.target);
  if (!a || !b) return null;
  const pa = pos3(a, offset);
  const pb = pos3(b, offset);
  const y = 0.12;
  const mid = [(pa[0] + pb[0]) / 2, y, (pa[2] + pb[2]) / 2];
  const dx = pb[0] - pa[0];
  const dz = pb[2] - pa[2];
  const len = Math.hypot(dx, dz) || 0.01;
  const yaw = Math.atan2(dx, dz);
  const r = active ? 0.045 : 0.025;
  const color = link.failed ? c.danger : active ? c.accent : s.link;
  return (
    <group position={mid} rotation={[0, yaw, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, len, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.9 : link.failed ? 0.35 : 0.08} roughness={0.5} />
      </mesh>
    </group>
  );
}

function PacketMarker({ hopAnimation, nodesById, offset, color }) {
  const ref = useRef();
  const from = hopAnimation ? nodesById.get(hopAnimation.fromNodeId) : null;
  const to = hopAnimation ? nodesById.get(hopAnimation.toNodeId) : null;
  useFrame(({ clock }) => {
    if (!ref.current || !from || !to) return;
    const a = pos3(from, offset);
    const b = pos3(to, offset);
    const t = (clock.getElapsedTime() % 1.1) / 1.1;
    const e = t * t * (3 - 2 * t);
    ref.current.position.set(a[0] + (b[0] - a[0]) * e, 0.28 + Math.sin(e * Math.PI) * 0.12, a[2] + (b[2] - a[2]) * e);
  });
  if (!from || !to) return null;
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={2.2} />
    </group>
  );
}

/* ─────────────────────────────── Scene ─────────────────────────────── */

function Scene({ topology, hopAnimation, selectedNodeId, onSelectNode, c, s, offset, extent }) {
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
      <color attach="background" args={[s.bg]} />
      <fog attach="fog" args={[s.bg, extent * 2.2 + 8, extent * 4.5 + 26]} />
      <ambientLight intensity={s.ambient * 0.5} />
      <hemisphereLight args={[s.hemiSky, s.hemiGround, s.ambient]} />
      <directionalLight
        position={[6, 10, 5]}
        intensity={s.key}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-6, 4, -4]} intensity={0.5} color={c.accent} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[Math.max(18, extent * 2.2), 96]} />
        <meshStandardMaterial color={s.ground} emissive={s.ground} emissiveIntensity={s.groundGlow} roughness={1} />
      </mesh>
      <gridHelper args={[Math.max(30, Math.ceil(extent * 4)), Math.max(30, Math.ceil(extent * 4)), s.grid1, s.grid2]} position={[0, 0.001, 0]} />

      {(topology.links || []).map((link) => (
        <Link key={link.id} link={link} nodesById={nodesById} offset={offset} active={link.id === activeLinkId} c={c} s={s} />
      ))}
      {(topology.nodes || []).map((node) => (
        <DeviceMesh key={node.id} node={node} selected={node.id === selectedNodeId} offset={offset} onSelect={onSelectNode} c={c} s={s} />
      ))}
      <PacketMarker hopAnimation={hopAnimation} nodesById={nodesById} offset={offset} color={c.accent} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.08} minDistance={3} maxDistance={Math.max(30, extent * 5)} />
    </>
  );
}

function LegendItem({ color, label, ring }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${ring ? 'ring-2 ring-offset-0' : ''}`} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}

export function NetworkScene3D({ topology, hopAnimation, selectedNodeId, onSelectNode }) {
  const c = useChartColors();
  const s = SCENE[c.resolved];

  const { offset, extent } = useMemo(() => {
    const ns = topology.nodes || [];
    if (!ns.length) return { offset: { x: 0, z: 0 }, extent: 4 };
    const xs = ns.map((n) => (n.position?.x || 0) / SCALE);
    const zs = ns.map((n) => (n.position?.y || 0) / SCALE);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    return {
      offset: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
      extent: Math.max(maxX - minX, maxZ - minZ, 4),
    };
  }, [topology]);

  return (
    <div className="relative h-full w-full" style={{ background: s.bg }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, extent * 0.9 + 3.2, extent * 1.2 + 5.2], fov: 42 }}
        gl={{ antialias: true }}
      >
        <Scene
          topology={topology}
          hopAnimation={hopAnimation}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          c={c}
          s={s}
          offset={offset}
          extent={extent}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4">
        <span className="status-pill !bg-surface/80 backdrop-blur">3D view · drag to orbit · scroll to zoom · right-drag to pan</span>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface/85 px-3 py-2 font-mono text-[10.5px] text-muted shadow-panel backdrop-blur">
        <LegendItem color={c.brand} label="Selected" />
        <LegendItem color={c.accent} label="Active hop" />
        <LegendItem color={c.danger} label="Failed" />
      </div>
    </div>
  );
}
