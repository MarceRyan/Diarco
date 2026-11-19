"use client";

/**
 * El mundo 3D de la casa de Chispa: cielo, luz, terreno y decorados por etapa.
 * Todo se genera con geometría (sin descargar texturas ni modelos).
 * Posiciones fijas o pseudoaleatorias con semilla, para que sea siempre igual.
 */
import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Estacion } from "@diarco/shared";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { crearLlama, ondularLlama } from "./chispa-3d";
import type { Momento } from "./fondo";

export const X_FOGATA_3D = 2.3;
export const Z_FOGATA_3D = -0.4;

/** Generador pseudoaleatorio con semilla (mismo mundo en cada visita). */
function semilla(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CIELO: Record<Momento, { colores: [string, string, string]; niebla: string; hemi: [string, string, number]; sol: [string, number] }> = {
  amanecer: { colores: ["#8f7cf5", "#ff9eb5", "#ffd9a0"], niebla: "#ffc9b0", hemi: ["#ffd2c2", "#6d5aa8", 0.9], sol: ["#ffb27a", 1.8] },
  dia: { colores: ["#2f8fff", "#79c9ff", "#d8f2ff"], niebla: "#c9ebff", hemi: ["#d6efff", "#5e8a4a", 1.1], sol: ["#fff4de", 2.4] },
  atardecer: { colores: ["#4a2bb5", "#ff5f7e", "#ffb347"], niebla: "#ff9f80", hemi: ["#ffb199", "#4b2e7a", 0.8], sol: ["#ff8a4a", 1.8] },
  noche: { colores: ["#07051c", "#1b1250", "#3a2878"], niebla: "#24185a", hemi: ["#5a6bc8", "#1a1238", 0.35], sol: ["#9fb4ff", 0.45] },
};

const TIERRA: Record<Estacion, { fondo: string; loma: string; suelo: string; copas: string[] }> = {
  primavera: { fondo: "#8fd3a8", loma: "#5cc483", suelo: "#49b36c", copas: ["#ff9fc0", "#ffc4d8", "#ff86ad"] },
  verano: { fondo: "#a9d672", loma: "#7cc043", suelo: "#5fa834", copas: ["#3aa85a", "#4fbf68", "#2f9550"] },
  otono: { fondo: "#e8ad78", loma: "#dc8646", suelo: "#bf6c3a", copas: ["#ff8a33", "#ffb03a", "#e4572e"] },
  invierno: { fondo: "#c8d6ef", loma: "#e2eaf8", suelo: "#f2f6ff", copas: ["#ffffff", "#eef4ff", "#dfe9fb"] },
};

function texturaCielo(colores: [string, string, string]) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, colores[0]);
  g.addColorStop(0.55, colores[1]);
  g.addColorStop(1, colores[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Cielo({ momento, compacta }: { momento: Momento; compacta: boolean }) {
  const datos = CIELO[momento];
  const fondo = useMemo(() => texturaCielo(datos.colores), [datos]);
  useEffect(() => () => fondo.dispose(), [fondo]);

  const astro: [number, number, number] = momento === "dia" ? [7, 9, -30] : momento === "noche" ? [-8, 8, -30] : [9, 3.2, -30];
  return (
    <>
      <primitive attach="background" object={fondo} />
      <fog attach="fog" args={[datos.niebla, 12, 42]} />
      <hemisphereLight args={[datos.hemi[0], datos.hemi[1], datos.hemi[2]]} />
      <directionalLight
        position={[5, 8, 5]}
        color={datos.sol[0]}
        intensity={datos.sol[1]}
        castShadow={!compacta}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        shadow-radius={6}
      />
      {/* Sol o luna (brilla con el bloom) */}
      <mesh position={astro}>
        <sphereGeometry args={[momento === "noche" ? 1.6 : 2.2, 32, 32]} />
        <meshBasicMaterial color={momento === "noche" ? "#fff6d8" : momento === "dia" ? "#fff2a8" : "#ffc37a"} toneMapped={false} />
      </mesh>
      {momento !== "dia" && <Stars radius={60} depth={20} count={compacta ? 600 : 1800} factor={3} fade speed={0.6} />}
    </>
  );
}

function Terreno({ estacion }: { estacion: Estacion }) {
  const t = TIERRA[estacion];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color={t.suelo} roughness={1} />
      </mesh>
      {/* Colinas suaves (medias esferas hundidas) */}
      {[
        [-9, -12, 7, t.loma],
        [4, -15, 9, t.loma],
        [14, -11, 6, t.loma],
        [-18, -20, 10, t.fondo],
        [0, -26, 12, t.fondo],
        [20, -24, 11, t.fondo],
      ].map(([x, z, r, color]) => (
        <mesh key={`${x}-${z}`} position={[x as number, -(r as number) * 0.62, z as number]} receiveShadow>
          <sphereGeometry args={[r as number, 48, 32]} />
          <meshStandardMaterial color={color as string} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Matas de pasto (instanciadas: cientos de briznas en una sola llamada de dibujo). */
function Pasto({ estacion, cantidad }: { estacion: Estacion; cantidad: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const malla = ref.current;
    if (!malla) return;
    const r = semilla(41);
    const o = new THREE.Object3D();
    const base = new THREE.Color(TIERRA[estacion].loma);
    const c = new THREE.Color();
    for (let i = 0; i < cantidad; i++) {
      o.position.set((r() - 0.5) * 18, 0, -6 + r() * 9);
      o.rotation.set((r() - 0.5) * 0.4, r() * Math.PI, (r() - 0.5) * 0.4);
      o.scale.set(1, 0.6 + r() * 0.9, 1);
      o.updateMatrix();
      malla.setMatrixAt(i, o.matrix);
      malla.setColorAt(i, c.copy(base).offsetHSL(0, 0, (r() - 0.5) * 0.12));
    }
    malla.instanceMatrix.needsUpdate = true;
    if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  }, [estacion, cantidad]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cantidad]} receiveShadow>
      <coneGeometry args={[0.035, 0.22, 4]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}

function Arbol({ x, z, escala = 1, copas }: { x: number; z: number; escala?: number; copas: string[] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + x) * 0.025;
  });
  return (
    <group position={[x, 0, z]} scale={escala} ref={ref}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.8, 16]} />
        <meshStandardMaterial color="#7a4b2f" roughness={0.9} />
      </mesh>
      {[
        [0, 2.4, 0, 0.95],
        [-0.65, 2.0, 0.15, 0.7],
        [0.7, 2.05, -0.1, 0.75],
        [0.15, 2.0, 0.6, 0.6],
      ].map(([cx, cy, cz, r], i) => (
        <mesh key={i} position={[cx!, cy!, cz!]} castShadow>
          <sphereGeometry args={[r!, 32, 24]} />
          <meshStandardMaterial color={copas[i % copas.length]} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function Flores({ estacion }: { estacion: Estacion }) {
  const flores = useMemo(() => {
    const r = semilla(7);
    return Array.from({ length: 16 }, () => ({
      x: (r() - 0.5) * 11,
      z: 0.6 + r() * 2.2,
      color: ["#ff6fa0", "#ffc23d", "#9378ec", "#ffffff"][Math.floor(r() * 4)]!,
      giro: r() * Math.PI,
    }));
  }, []);
  return (
    <group>
      {flores.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]} rotation={[0, f.giro, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
            <meshStandardMaterial color="#2f7d45" />
          </mesh>
          {estacion === "invierno" ? (
            <mesh position={[0, 0.26, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
          ) : (
            [0, 1, 2, 3, 4].map((p) => {
              const a = (p / 5) * Math.PI * 2;
              return (
                <mesh key={p} position={[Math.cos(a) * 0.05, 0.26, Math.sin(a) * 0.05]} scale={[1, 0.5, 1]}>
                  <sphereGeometry args={[0.045, 10, 10]} />
                  <meshStandardMaterial color={f.color} roughness={0.6} />
                </mesh>
              );
            })
          )}
        </group>
      ))}
    </group>
  );
}

function Fogata({ etapa, encendida }: { etapa: number; encendida: boolean }) {
  const llama = useMemo(() => crearLlama(1.0, 0.36, ["#fff1a0", "#ff9a1f", "#ff4a1c"], 32), []);
  const luz = useRef<THREE.PointLight>(null);
  const humo = useRef<THREE.Group>(null);
  useEffect(() => () => llama.dispose(), [llama]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (encendida) ondularLlama(llama, 1.0, t * 1.4, 1.6);
    if (luz.current) luz.current.intensity = 6 + Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6;
    if (humo.current) {
      humo.current.children.forEach((h, i) => {
        const fase = (t * 0.3 + i / 5) % 1;
        h.position.set(Math.sin(fase * 4 + i) * 0.15, 0.25 + fase * 1.6, 0);
        h.scale.setScalar(0.06 + fase * 0.16);
        ((h as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.45 * Math.sin(fase * Math.PI);
      });
    }
  });
  return (
    <group position={[X_FOGATA_3D, 0, Z_FOGATA_3D]}>
      {etapa >= 6 &&
        Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.62, 0.06, Math.sin(a) * 0.62]} scale={[1, 0.6, 0.9]} castShadow receiveShadow>
              <sphereGeometry args={[0.14, 16, 12]} />
              <meshStandardMaterial color="#9a93b0" roughness={0.9} />
            </mesh>
          );
        })}
      {[-0.5, 0.5].map((g) => (
        <mesh key={g} position={[0, 0.09, 0]} rotation={[0, g, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.95, 16]} />
          <meshStandardMaterial color={g > 0 ? "#8a5a3c" : "#a46b45"} roughness={0.9} />
        </mesh>
      ))}
      {encendida ? (
        <>
          <mesh geometry={llama} position={[0, 0.12, 0]}>
            <meshStandardMaterial vertexColors emissive="#ff7a1a" emissiveIntensity={1.2} roughness={0.4} toneMapped={false} />
          </mesh>
          <pointLight ref={luz} position={[0, 0.6, 0]} color="#ff8a33" intensity={6} distance={6} decay={1.5} />
        </>
      ) : (
        <group ref={humo}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#8f87a8" transparent opacity={0} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/** Guirnalda de focos: con el desenfoque se ven como luces bokeh. */
function Guirnalda() {
  const { curva, focos } = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, 3.6, -3.5),
      new THREE.Vector3(-3.5, 2.7, -3.5),
      new THREE.Vector3(0, 3.3, -3.5),
      new THREE.Vector3(3.5, 2.7, -3.5),
      new THREE.Vector3(7, 3.6, -3.5),
    ]);
    const colores = ["#ff6a2b", "#ffc23d", "#3ddc97", "#4dabf7", "#ff6fa0"];
    const focos = Array.from({ length: 22 }, (_, i) => ({ p: curva.getPoint(i / 21), color: colores[i % colores.length]! }));
    return { curva, focos };
  }, []);
  const grupo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    grupo.current?.children.forEach((f, i) => {
      const m = (f as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const v = 0.75 + Math.sin(clock.elapsedTime * 2 + i) * 0.25;
      m.color.set(focos[i]!.color).multiplyScalar(1.6 * v);
    });
  });
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curva, 80, 0.015, 6, false]} />
        <meshStandardMaterial color="#2a2342" />
      </mesh>
      <group ref={grupo}>
        {focos.map((f, i) => (
          <mesh key={i} position={[f.p.x, f.p.y - 0.12, f.p.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={f.color} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Luciernagas({ cantidad }: { cantidad: number }) {
  const datos = useMemo(() => {
    const r = semilla(11);
    return Array.from({ length: cantidad }, () => ({ x: (r() - 0.5) * 12, y: 0.4 + r() * 2.2, z: -2.5 + r() * 4, f: r() * 10 }));
  }, [cantidad]);
  const grupo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    grupo.current?.children.forEach((m, i) => {
      const d = datos[i]!;
      m.position.set(d.x + Math.sin(t * 0.5 + d.f) * 0.6, d.y + Math.sin(t * 0.8 + d.f * 2) * 0.3, d.z + Math.cos(t * 0.4 + d.f) * 0.4);
      m.scale.setScalar(0.6 + Math.max(0, Math.sin(t * 2.5 + d.f)) * 0.6);
    });
  });
  return (
    <group ref={grupo}>
      {datos.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshBasicMaterial color={[2.2, 2.0, 0.8]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Nubes({ momento }: { momento: Momento }) {
  const grupo = useRef<THREE.Group>(null);
  const nubes = useMemo(
    () => [
      { x: -10, y: 7.5, z: -22, s: 1.4, v: 0.25 },
      { x: 4, y: 9, z: -26, s: 1.8, v: 0.18 },
      { x: 14, y: 6.5, z: -20, s: 1.1, v: 0.3 },
    ],
    [],
  );
  useFrame((_, dt) => {
    grupo.current?.children.forEach((g, i) => {
      g.position.x += nubes[i]!.v * dt;
      if (g.position.x > 26) g.position.x = -26;
    });
  });
  return (
    <group ref={grupo}>
      {nubes.map((n, i) => (
        <group key={i} position={[n.x, n.y, n.z]} scale={n.s}>
          {[
            [0, 0, 0, 1.2],
            [-1.2, -0.3, 0.2, 0.85],
            [1.2, -0.25, 0, 0.9],
            [0.5, 0.5, -0.3, 0.8],
          ].map(([x, y, z, r], k) => (
            <mesh key={k} position={[x!, y!, z!]}>
              <sphereGeometry args={[r!, 24, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={momento === "noche" ? 0.02 : 0.25}
                roughness={1}
                transparent
                opacity={momento === "noche" ? 0.35 : 0.95}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Volcan() {
  const humo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    humo.current?.children.forEach((h, i) => {
      const fase = (clock.elapsedTime * 0.12 + i / 4) % 1;
      h.position.set(Math.sin(fase * 3) * 0.6, 4.2 + fase * 5, 0);
      h.scale.setScalar(0.6 + fase * 1.6);
      ((h as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - fase);
    });
  });
  return (
    <group position={[5.5, 0, -11]}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[1, 4.2, 4.2, 32]} />
        <meshStandardMaterial color="#7c5c4a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color={[3, 1.1, 0.3]} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4.6, 0]} color="#ff6a2b" intensity={8} distance={8} />
      <group ref={humo}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color="#cfc6dd" transparent opacity={0.6} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Aurora({ momento }: { momento: Momento }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(61,220,151,0)");
    g.addColorStop(0.3, "rgba(61,220,151,0.9)");
    g.addColorStop(0.7, "rgba(147,120,236,0.9)");
    g.addColorStop(1, "rgba(147,120,236,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 64);
    const v = ctx.createLinearGradient(0, 0, 0, 64);
    v.addColorStop(0, "rgba(0,0,0,1)");
    v.addColorStop(0.5, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 256, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x = Math.sin(clock.elapsedTime * 0.2) * 3;
    ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * 0.5) * 0.25;
  });
  return (
    <mesh ref={ref} position={[0, 10, -32]} rotation={[0, 0, 0.08]}>
      <planeGeometry args={[60, 6]} />
      <meshBasicMaterial map={tex} transparent opacity={momento === "noche" ? 0.9 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </mesh>
  );
}

function EstrellasFugaces() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const fase = (clock.elapsedTime % 6) / 6;
    const visible = fase > 0.8;
    ref.current.visible = visible;
    const k = (fase - 0.8) / 0.2;
    ref.current.position.set(12 - k * 22, 11 - k * 6, -30);
  });
  return (
    <mesh ref={ref} rotation={[0, 0, 0.27]}>
      <capsuleGeometry args={[0.06, 2.4, 4, 8]} />
      <meshBasicMaterial color={[3, 3, 3]} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** Partículas de la estación: pétalos, motas doradas, hojas o nieve. */
function Particulas({ estacion, cantidad }: { estacion: Estacion; cantidad: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const datos = useMemo(() => {
    const r = semilla(23);
    return Array.from({ length: cantidad }, () => ({
      x: (r() - 0.5) * 16,
      y: r() * 7,
      z: -4 + r() * 7,
      v: 0.25 + r() * 0.4,
      f: r() * 10,
    }));
  }, [cantidad]);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const sube = estacion === "verano";

  useFrame(({ clock }, dt) => {
    const malla = ref.current;
    if (!malla) return;
    const t = clock.elapsedTime;
    datos.forEach((d, i) => {
      d.y += (sube ? 1 : -1) * d.v * dt;
      if (!sube && d.y < 0) d.y = 7;
      if (sube && d.y > 7) d.y = 0;
      temp.position.set(d.x + Math.sin(t * 0.9 + d.f) * 0.5, d.y, d.z);
      temp.rotation.set(t + d.f, t * 0.7 + d.f, 0);
      temp.updateMatrix();
      malla.setMatrixAt(i, temp.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;
  });

  const color =
    estacion === "primavera" ? "#ffb3cd" : estacion === "otono" ? "#ff8a33" : estacion === "invierno" ? "#ffffff" : "#fff0a0";
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cantidad]}>
      {estacion === "otono" || estacion === "primavera" ? (
        <sphereGeometry args={[0.06, 8, 6]} />
      ) : (
        <sphereGeometry args={[estacion === "invierno" ? 0.035 : 0.025, 8, 6]} />
      )}
      {sube ? (
        <meshBasicMaterial color={[2, 1.8, 0.8]} toneMapped={false} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.8} />
      )}
    </instancedMesh>
  );
}

export function Mundo3D({
  momento,
  estacion,
  etapa,
  dormida,
  compacta,
}: {
  momento: Momento;
  estacion: Estacion;
  etapa: number;
  dormida: boolean;
  compacta: boolean;
}) {
  const t = TIERRA[estacion];
  return (
    <>
      <Cielo momento={momento} compacta={compacta} />
      <Terreno estacion={estacion} />
      <Pasto estacion={estacion} cantidad={compacta ? 250 : 700} />
      <Nubes momento={momento} />
      {/* Árboles lejanos siempre; el árbol cercano llega en la etapa 3 */}
      <Arbol x={-6.5} z={-7} escala={1.2} copas={t.copas} />
      <Arbol x={5.5} z={-8.5} escala={1.4} copas={t.copas} />
      <Arbol x={-1.5} z={-10} escala={1.1} copas={t.copas} />
      {etapa >= 3 && <Arbol x={-3.1} z={-1.6} copas={t.copas} />}
      {etapa >= 2 && <Flores estacion={estacion} />}
      {etapa >= 4 && <Fogata etapa={etapa} encendida={!dormida} />}
      {etapa >= 5 && <Luciernagas cantidad={compacta ? 8 : 16} />}
      {etapa >= 7 && <Guirnalda />}
      {etapa >= 8 && <Aurora momento={momento} />}
      {etapa >= 9 && <Volcan />}
      {etapa >= 10 && <EstrellasFugaces />}
      <Particulas estacion={estacion} cantidad={compacta ? 30 : 70} />
    </>
  );
}
