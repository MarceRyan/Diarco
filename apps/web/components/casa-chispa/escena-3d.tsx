"use client";

/**
 * La casa de Chispa en 3D (se carga solo en el navegador, con next/dynamic).
 * Chispa decide sola qué hacer: pasear, ir a la fogata, saltar, bailar o mirar.
 * Gira hacia donde camina, rebota con "aplastar y estirar", mira al puntero y
 * reacciona al tocarla. Bloom + profundidad de campo dan el look de película.
 */
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { Estacion } from "@diarco/shared";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { ALTO_CHISPA, Chispa3D, type Gesto } from "./chispa-3d";
import type { Momento } from "./fondo";
import { Mundo3D, X_FOGATA_3D, Z_FOGATA_3D } from "./mundo-3d";

/** Tamaño de Chispa por etapa. */
const ESCALA = [0.62, 0.7, 0.77, 0.84, 0.9, 0.95, 1.0, 1.04, 1.08, 1.12];

type Accion = "quieta" | "caminar" | "calentarse" | "saltar" | "bailar" | "mirar";

const azar = (min: number, max: number) => min + Math.random() * (max - min);

export type PropsEscena3D = {
  etapa: number;
  estacion: Estacion;
  dormida: boolean;
  momento: Momento;
  compacta: boolean;
  quieta: boolean;
  /** Veces que la tocaron (lo lleva el envoltorio HTML, que también atiende el teclado). */
  toques: number;
  onTocar: () => void;
  /** Elemento HTML que sigue a la cabeza de Chispa (globo de texto y "z z"). */
  anclaRef: RefObject<HTMLDivElement | null>;
};

function Personaje({ etapa, estacion, dormida, momento, compacta, quieta, toques, onTocar, anclaRef }: PropsEscena3D) {
  const escala = ESCALA[Math.min(Math.max(etapa, 1), 10) - 1]!;
  const hayFogata = etapa >= 4;
  const { viewport, camera, pointer, size } = useThree();
  const cabeza = useMemo(() => new THREE.Vector3(), []);

  const raiz = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const mirada = useRef(new THREE.Vector2(0, 0));
  // Dormida descansa junto a la fogata; despierta empieza al centro.
  const inicio = useMemo<[number, number, number]>(() => [dormida && hayFogata ? X_FOGATA_3D - 1.3 : 0, 0, 0], [dormida, hayFogata]);
  const objetivo = useRef(new THREE.Vector3(...inicio));
  const salto = useRef(0); // 0..1 mientras salta
  const accionRef = useRef<Accion>("quieta");
  const punteroDentro = useRef(false);

  const [accion, setAccion] = useState<Accion>("quieta");
  const [cerca, setCerca] = useState(false);

  // Cada toque (mouse, dedo o teclado) la hace saltar.
  useEffect(() => {
    if (toques > 0 && !dormida) salto.current = 1;
  }, [toques, dormida]);

  // Rango por donde puede caminar (lo visible en el plano z = 0).
  const rango = useMemo(() => {
    const v = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
    const mitad = Math.min(v.width / 2 - 0.9 * escala - 0.3, 4.2);
    return Math.max(mitad, 0.6);
  }, [viewport, camera, escala]);

  // Cerebro: elige la siguiente acción al terminar la anterior.
  useEffect(() => {
    if (dormida || quieta) return;
    let t: ReturnType<typeof setTimeout>;
    let irAFogata = false;
    const hacer = (a: Accion) => {
      accionRef.current = a;
      setAccion(a);
    };
    const caminarA = (x: number, z: number) => {
      const x2 = THREE.MathUtils.clamp(x, -rango, rango);
      objetivo.current.set(x2, 0, z);
      hacer("caminar");
      const pos = raiz.current?.position.x ?? 0;
      return Math.max(Math.abs(x2 - pos) * 650, 700);
    };
    const siguiente = () => {
      let ms: number;
      if (irAFogata) {
        irAFogata = false;
        hacer("calentarse");
        ms = 4200;
      } else {
        const r = Math.random();
        if (r < 0.36) ms = caminarA(azar(-rango, rango), azar(-0.6, 0.8));
        else if (r < 0.5 && hayFogata) {
          const lado = (raiz.current?.position.x ?? 0) < X_FOGATA_3D ? -1 : 1;
          ms = caminarA(X_FOGATA_3D + lado * 1.25, Z_FOGATA_3D + 0.3);
          irAFogata = true;
        } else if (r < 0.64) {
          hacer("saltar");
          salto.current = 1;
          ms = 900;
        } else if (r < 0.77) {
          hacer("bailar");
          ms = 2600;
        } else if (r < 0.9) {
          hacer("mirar");
          ms = 2400;
        } else {
          hacer("quieta");
          ms = 2400;
        }
      }
      t = setTimeout(siguiente, ms + azar(400, 1300));
    };
    t = setTimeout(siguiente, 1000);
    return () => clearTimeout(t);
  }, [dormida, quieta, hayFogata, rango]);

  useFrame(({ clock }, dt) => {
    const g = raiz.current;
    const c = cuerpo.current;
    if (!g || !c) return;
    const t = clock.elapsedTime;
    const a = accionRef.current;

    // Desplazamiento hacia el objetivo
    const dx = objetivo.current.x - g.position.x;
    const dz = objetivo.current.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    const camina = a === "caminar" && dist > 0.05;
    if (camina) {
      const paso = Math.min(dist, 1.6 * dt);
      g.position.x += (dx / dist) * paso;
      g.position.z += (dz / dist) * paso;
    }

    // Hacia dónde mira el cuerpo: dirección de marcha, la fogata o al frente
    let giro = 0;
    if (camina) giro = Math.atan2(dx, dz) * 0.55;
    else if (a === "calentarse") giro = (X_FOGATA_3D - g.position.x > 0 ? 1 : -1) * 0.7;
    else if (a === "mirar") giro = Math.sin(t * 1.4) * 0.6;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, giro, 0.08);

    // Mirada de los ojos: al puntero si está sobre la escena, si no según la acción
    const m = mirada.current;
    if (punteroDentro.current && !compacta) m.lerp(new THREE.Vector2(pointer.x * 1.4 - g.position.x * 0.15, pointer.y * 1.2), 0.15);
    else if (a === "mirar") m.set(Math.sin(t * 1.4), 0.2);
    else if (camina) m.set(Math.sign(dx) * 0.6, 0);
    else m.lerp(new THREE.Vector2(0, 0.1), 0.05);

    // Cuerpo: saltitos al caminar, salto con aplastar/estirar, baile, respiración
    let y = 0;
    let sx = 1;
    let sy = 1;
    let rz = 0;
    if (dormida) {
      sy = 1 + Math.sin(t * 1.6) * 0.03;
      sx = 1 - Math.sin(t * 1.6) * 0.02;
    } else if (salto.current > 0) {
      salto.current = Math.max(0, salto.current - dt * 1.4);
      const k = 1 - salto.current; // 0 → 1
      if (k < 0.15) {
        sy = 1 - (k / 0.15) * 0.25; // se agacha
        sx = 1 + (k / 0.15) * 0.18;
      } else {
        const u = (k - 0.15) / 0.85;
        y = Math.sin(u * Math.PI) * 1.1;
        sy = 1 + Math.sin(u * Math.PI) * 0.12;
        sx = 1 - Math.sin(u * Math.PI) * 0.08;
        if (u > 0.92) {
          sy = 0.85;
          sx = 1.12;
        }
      }
    } else if (camina) {
      y = Math.abs(Math.sin(t * 9)) * 0.18;
      rz = Math.sin(t * 9) * 0.06;
    } else if (a === "bailar") {
      rz = Math.sin(t * 7) * 0.25;
      y = Math.abs(Math.sin(t * 7)) * 0.12;
    } else {
      sy = 1 + Math.sin(t * 2.2) * 0.025;
      sx = 1 - Math.sin(t * 2.2) * 0.015;
    }
    if (cerca && !dormida && salto.current === 0) rz += Math.sin(t * 10) * 0.08;
    c.position.y = THREE.MathUtils.lerp(c.position.y, y, 0.5);
    c.scale.set(sx, sy, sx);
    c.rotation.z = THREE.MathUtils.lerp(c.rotation.z, rz, 0.3);

    // Ancla del globo (HTML fuera del lienzo): proyecta la cabeza de Chispa a la pantalla.
    const ancla = anclaRef.current;
    if (ancla) {
      cabeza.set(g.position.x, (ALTO_CHISPA + 0.25) * escala + c.position.y, g.position.z).project(camera);
      ancla.style.transform = `translate(${((cabeza.x + 1) / 2) * size.width}px, ${((1 - cabeza.y) / 2) * size.height}px)`;
    }
  });

  const tocar = (ev: ThreeEvent<MouseEvent>) => {
    ev.stopPropagation();
    if (!compacta) onTocar();
  };

  const gesto: Gesto = dormida
    ? "dormida"
    : cerca || accion === "saltar"
      ? "emocionada"
      : accion === "bailar" || accion === "calentarse"
        ? "celebrando"
        : "feliz";

  return (
    <group
      ref={raiz}
      position={inicio}
      scale={escala}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (compacta) return;
        setCerca(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setCerca(false);
        document.body.style.cursor = "";
      }}
      onClick={tocar}
    >
      {/* Detecta si el puntero está sobre la escena (para que lo mire) */}
      <group ref={cuerpo}>
        <Chispa3D
          etapa={etapa}
          estacion={estacion}
          gesto={gesto}
          mirada={mirada}
          bailando={accion === "bailar"}
          noche={momento === "noche"}
        />
      </group>

      {/* Sombra de contacto suave bajo Chispa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#120d33" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {toques > 0 && <Chispitas key={toques} />}

      {/* Marca invisible para saber si el puntero anda por la escena */}
      <PunteroEnEscena dentro={punteroDentro} />
    </group>
  );
}

/** Guarda en `dentro` si el puntero está sobre el lienzo. */
function PunteroEnEscena({ dentro }: { dentro: RefObject<boolean> }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const entrar = () => (dentro.current = true);
    const salir = () => (dentro.current = false);
    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointerleave", salir);
    return () => {
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointerleave", salir);
    };
  }, [gl, dentro]);
  return null;
}

/** Estallido de chispitas al tocar a Chispa. */
function Chispitas() {
  const grupo = useRef<THREE.Group>(null);
  const datos = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return { v: new THREE.Vector3(Math.cos(a) * 1.6, 2 + (i % 3) * 0.6, Math.sin(a) * 1.6), color: ["#ffc23d", "#ff6a2b", "#9378ec"][i % 3]! };
      }),
    [],
  );
  const vida = useRef(0);
  useFrame((_, dt) => {
    vida.current += dt;
    const g = grupo.current;
    if (!g) return;
    const k = vida.current;
    g.visible = k < 0.9;
    g.children.forEach((m, i) => {
      const d = datos[i]!;
      m.position.set(d.v.x * k, 0.9 + d.v.y * k - 4 * k * k, d.v.z * k);
      m.scale.setScalar(Math.max(0, 1 - k));
    });
  });
  return (
    <group ref={grupo}>
      {datos.map((d, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.07]} />
          <meshBasicMaterial color={d.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Escena3D(props: PropsEscena3D) {
  const { compacta, quieta, momento } = props;
  const contenedor = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pausa el render cuando la escena no está en pantalla (ahorra batería).
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={contenedor} className="absolute inset-0">
      <Canvas
        shadows={!compacta}
        dpr={compacta ? [1, 1.5] : [1, 2]}
        frameloop={!visible ? "never" : quieta ? "demand" : "always"}
        camera={{ position: [0, 1.7, 5.6], fov: compacta ? 32 : 36 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => camera.lookAt(0, 0.95, -1)}
      >
        <Mundo3D momento={momento} estacion={props.estacion} etapa={props.etapa} dormida={props.dormida} compacta={compacta} />
        <Personaje {...props} />
        {compacta ? (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.9} />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={4}>
            <DepthOfField target={[0, 0.9, 0]} worldFocusRange={4} bokehScale={3.5} />
            <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.15} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
