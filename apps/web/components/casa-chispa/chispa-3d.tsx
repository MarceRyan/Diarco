"use client";

/**
 * Chispa en 3D: una llama con volumen, luz propia y cara expresiva.
 * - El cuerpo es una gota torneada (LatheGeometry) con degradado de color por vértice;
 *   cada cuadro se deforma para que la punta ondule como fuego de verdad.
 * - Ojos grandes y brillantes cuyo iris gira hacia donde mira (`mirada`).
 * - Bracitos que se balancean, mejillas, boca según el gesto y accesorio de la estación.
 * Unidades: 1 ≈ media Chispa; mide 1.7 de alto a escala 1, con la base en y = 0.
 */
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Estacion } from "@diarco/shared";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

export type Gesto = "feliz" | "emocionada" | "celebrando" | "dormida";

export const ALTO_CHISPA = 1.7;

/** Paletas del degradado (abajo → medio → punta) por etapa. */
const PALETAS: Record<string, [string, string, string]> = {
  normal: ["#ffe066", "#ff8a1f", "#ff4a1c"],
  dorada: ["#fff4b8", "#ffc21f", "#ff9a0a"],
  azul: ["#dff3ff", "#4aa3ff", "#2b55ff"],
  dormida: ["#e9e4fb", "#c4b9ec", "#9d8fd6"],
};

export function paletaDeEtapa(etapa: number): keyof typeof PALETAS {
  return etapa === 7 ? "dorada" : etapa === 8 ? "azul" : "normal";
}

/** Perfil de gota: base redonda y punta afilada (cóncava). */
function perfilGota(alto: number, radio: number, pasos = 40) {
  const puntos: THREE.Vector2[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    let r: number;
    if (t < 0.38) {
      const u = (0.38 - t) / 0.38;
      r = radio * Math.sqrt(Math.max(0, 1 - u * u));
    } else {
      r = radio * Math.pow(1 - (t - 0.38) / 0.62, 1.45);
    }
    puntos.push(new THREE.Vector2(Math.max(r, 0.0001), t * alto));
  }
  return puntos;
}

/** Geometría de llama con color por vértice (más clara al frente y abajo: "núcleo"). */
export function crearLlama(alto: number, radio: number, paleta: [string, string, string], segmentos = 48) {
  const geo = new THREE.LatheGeometry(perfilGota(alto, radio), segmentos);
  const [c0, c1, c2] = paleta.map((c) => new THREE.Color(c)) as [THREE.Color, THREE.Color, THREE.Color];
  const nucleo = new THREE.Color(paleta[0]);
  const pos = geo.attributes.position!;
  const colores = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / alto;
    if (t < 0.5) c.copy(c0).lerp(c1, t / 0.5);
    else c.copy(c1).lerp(c2, (t - 0.5) / 0.5);
    // Frente (z+) y parte baja más luminosos: da la ilusión de llama interior.
    const r = Math.hypot(pos.getX(i), pos.getZ(i)) || 1;
    const frente = Math.max(0, pos.getZ(i) / r);
    c.lerp(nucleo, frente * Math.max(0, 1 - t * 1.6) * 0.75);
    colores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  geo.userData.original = Float32Array.from(pos.array as Float32Array);
  return geo;
}

/** Ondula la llama: la punta se mece más que la base. */
export function ondularLlama(geo: THREE.BufferGeometry, alto: number, tiempo: number, fuerza = 1) {
  const orig = geo.userData.original as Float32Array;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  for (let i = 0; i < pos.count; i++) {
    const x = orig[i * 3]!;
    const y = orig[i * 3 + 1]!;
    const z = orig[i * 3 + 2]!;
    const t = y / alto;
    const t2 = t * t;
    arr[i * 3] = x + Math.sin(tiempo * 2.6 + t * 3.2) * 0.09 * t2 * fuerza;
    arr[i * 3 + 1] = y + Math.sin(tiempo * 3.4) * 0.05 * t2 * t * fuerza;
    arr[i * 3 + 2] = z + Math.cos(tiempo * 2.1 + t * 2.4) * 0.05 * t2 * fuerza;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

const TINTA = "#241c3d";

function Ojo({ x, mirada, gesto }: { x: number; mirada: RefObject<THREE.Vector2>; gesto: Gesto }) {
  const iris = useRef<THREE.Group>(null);
  const parpado = useRef<THREE.Group>(null);
  const grande = gesto === "emocionada";

  useFrame(({ clock }) => {
    const m = mirada.current;
    if (iris.current && m) {
      iris.current.rotation.y = THREE.MathUtils.lerp(iris.current.rotation.y, m.x * 0.55, 0.2);
      iris.current.rotation.x = THREE.MathUtils.lerp(iris.current.rotation.x, -m.y * 0.4, 0.2);
    }
    // Parpadeo cada ~4 s (los dos ojos a la vez)
    if (parpado.current) {
      const ciclo = clock.elapsedTime % 4.2;
      parpado.current.scale.y = ciclo > 4.05 ? 0.12 : 1;
    }
  });

  return (
    <group position={[x, 0.66, 0.5]} ref={parpado}>
      {/* Esclerótica brillante */}
      <mesh scale={grande ? 1.12 : 1}>
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* Iris + pupila + brillos, girando sobre el ojo */}
      <group ref={iris}>
        {/* El iris asoma por delante de la esclerótica (radio 0.17) */}
        <mesh position={[0, 0, 0.13]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.11, 32, 32]} />
          <meshPhysicalMaterial color="#5a3a1e" roughness={0.25} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.158]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshStandardMaterial color="#0b0814" roughness={0.1} />
        </mesh>
        <mesh position={[0.045, 0.05, 0.19]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.04, -0.045, 0.188]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

/** Ojo cerrado en arco: ∩ feliz (celebrando) o ∪ dormida. */
function OjoCerrado({ x, alegre }: { x: number; alegre: boolean }) {
  return (
    <mesh position={[x, 0.64, 0.6]} rotation={[0, 0, alegre ? 0 : Math.PI]}>
      <torusGeometry args={[0.09, 0.025, 12, 24, Math.PI]} />
      <meshStandardMaterial color={TINTA} roughness={0.4} />
    </mesh>
  );
}

function Boca({ gesto }: { gesto: Gesto }) {
  if (gesto === "dormida") {
    return (
      <mesh position={[0, 0.4, 0.6]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color={TINTA} />
      </mesh>
    );
  }
  if (gesto === "feliz") {
    return (
      <mesh position={[0, 0.43, 0.6]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.09, 0.026, 12, 24, Math.PI]} />
        <meshStandardMaterial color={TINTA} roughness={0.4} />
      </mesh>
    );
  }
  // Boca abierta con lengua
  return (
    <group position={[0, 0.38, 0.57]}>
      <mesh scale={[1.25, 0.9, 0.55]}>
        <sphereGeometry args={[0.1, 24, 24, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
        <meshStandardMaterial color={TINTA} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.05, 0.02]} scale={[1, 0.55, 0.6]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ff6f8f" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Accesorio({ estacion }: { estacion: Estacion }) {
  if (estacion === "invierno") {
    return (
      <group position={[0, 0.98, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e64980" roughness={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.08, 16, 40]} />
          <meshStandardMaterial color="#f8f6ff" roughness={1} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.12, 20, 20]} />
          <meshStandardMaterial color="#f8f6ff" roughness={1} />
        </mesh>
      </group>
    );
  }
  if (estacion === "verano") {
    return (
      <group position={[0, 0.67, 0.66]}>
        {[-0.21, 0.21].map((x) => (
          <RoundedBox key={x} args={[0.3, 0.2, 0.06]} radius={0.06} position={[x, 0, 0]}>
            <meshPhysicalMaterial color="#141020" roughness={0.05} clearcoat={1} metalness={0.3} />
          </RoundedBox>
        ))}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.14, 0.03, 0.03]} />
          <meshStandardMaterial color="#141020" />
        </mesh>
      </group>
    );
  }
  if (estacion === "otono") {
    return (
      <group position={[0, 0.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.58, 0.11, 16, 48]} />
          <meshStandardMaterial color="#6741d9" roughness={0.9} />
        </mesh>
        <RoundedBox args={[0.18, 0.36, 0.08]} radius={0.04} position={[0.28, -0.18, 0.55]} rotation={[0.2, 0, -0.15]}>
          <meshStandardMaterial color="#6741d9" roughness={0.9} />
        </RoundedBox>
      </group>
    );
  }
  // Primavera: flor al costado de la cabeza
  return (
    <group position={[0.36, 0.98, 0.26]} rotation={[0.3, 0.6, -0.3]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0]} scale={[1, 1, 0.45]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#ff8fb1" roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#ffc23d" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Chispa3D({
  etapa,
  estacion,
  gesto,
  mirada,
  bailando,
  noche = false,
}: {
  etapa: number;
  estacion: Estacion;
  gesto: Gesto;
  /** Dirección de la mirada (-1..1); la escribe la escena. */
  mirada: RefObject<THREE.Vector2>;
  bailando: boolean;
  /** De noche brilla más (es la luz principal de la escena). */
  noche?: boolean;
}) {
  const dormida = gesto === "dormida";
  const paleta = PALETAS[dormida ? "dormida" : paletaDeEtapa(etapa)]!;
  const cuerpo = useMemo(() => crearLlama(ALTO_CHISPA, 0.64, paleta), [paleta]);
  const lengua = useMemo(() => crearLlama(0.7, 0.2, paleta, 24), [paleta]);
  const brazoIzq = useRef<THREE.Group>(null);
  const brazoDer = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ondularLlama(cuerpo, ALTO_CHISPA, t, dormida ? 0.25 : 1);
    ondularLlama(lengua, 0.7, t + 1.3, dormida ? 0.2 : 1.4);
    const vaiven = bailando ? Math.sin(t * 9) * 0.9 : gesto === "celebrando" ? Math.sin(t * 6) * 0.5 : Math.sin(t * 2) * 0.15;
    if (brazoIzq.current) brazoIzq.current.rotation.z = 0.5 + vaiven + (gesto === "emocionada" ? 0.8 : 0);
    if (brazoDer.current) brazoDer.current.rotation.z = -0.5 - vaiven - (gesto === "emocionada" ? 0.8 : 0);
    if (halo.current) halo.current.rotation.y = t * 0.9;
  });

  const material = (
    <meshStandardMaterial
      vertexColors
      roughness={0.38}
      emissive={dormida ? "#000000" : paleta[1]}
      emissiveIntensity={dormida ? 0 : noche ? 0.65 : 0.18}
    />
  );

  return (
    <group>
      {/* Cuerpo */}
      <mesh geometry={cuerpo} castShadow>
        {material}
      </mesh>
      {/* Lengüita de fuego al costado (como en el logo) */}
      <mesh geometry={lengua} position={[-0.42, 0.55, -0.05]} rotation={[0, 0, 0.5]} castShadow>
        {material}
      </mesh>

      {/* Brazos */}
      {[
        { ref: brazoIzq, x: -0.6 },
        { ref: brazoDer, x: 0.6 },
      ].map(({ ref, x }) => (
        <group key={x} ref={ref} position={[x, 0.42, 0.05]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.16, 8, 16]} />
            <meshStandardMaterial color={paleta[1]} emissive={dormida ? "#000" : paleta[1]} emissiveIntensity={0.25} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Cara */}
      {gesto === "dormida" || gesto === "celebrando" ? (
        <>
          <OjoCerrado x={-0.2} alegre={gesto === "celebrando"} />
          <OjoCerrado x={0.2} alegre={gesto === "celebrando"} />
        </>
      ) : estacion !== "verano" ? (
        <>
          <Ojo x={-0.2} mirada={mirada} gesto={gesto} />
          <Ojo x={0.2} mirada={mirada} gesto={gesto} />
        </>
      ) : null}
      {!dormida &&
        [-0.36, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.48, 0.5]} scale={[1, 0.65, 0.4]}>
            <sphereGeometry args={[0.085, 16, 16]} />
            <meshStandardMaterial color="#ff7d9c" transparent opacity={gesto === "emocionada" ? 0.95 : 0.7} roughness={0.6} />
          </mesh>
        ))}
      <Boca gesto={gesto} />
      {!(estacion === "verano" && dormida) && <Accesorio estacion={estacion} />}

      {/* Luz propia: Chispa ilumina el suelo a su alrededor */}
      {!dormida && <pointLight position={[0, 0.35, -0.1]} color={paleta[1]} intensity={noche ? 5 : 3} distance={4} decay={1.6} />}

      {/* Halo de estrellitas (etapa 10) */}
      {etapa >= 10 && !dormida && (
        <group ref={halo} position={[0, 1.15, 0]}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.95, Math.sin(a * 2) * 0.12, Math.sin(a) * 0.95]}>
                <octahedronGeometry args={[0.09]} />
                <meshBasicMaterial color="#ffe066" toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
