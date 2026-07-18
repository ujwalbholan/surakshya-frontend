"use client";

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Plane, Sphere, useTexture } from "@react-three/drei";
import { X } from "lucide-react";

/**
 * Single-file Stellar Card Gallery
 * - Starfield, Galaxy, FloatingCard, Modal, and Page in one.
 * - Panel-scoped for login left column (not full-viewport).
 * - Selection state is prop-drilled across the R3F Canvas boundary.
 */

const ACCENT = "#CC2233";

type Card = {
  id: string;
  imageUrl: string;
  alt: string;
  title: string;
};

/** Photos from `public/login-images` (spaces/parens URL-encoded). */
const LOGIN_IMAGES: { file: string; alt: string; title: string }[] = [
  {
    file: "istockphoto-1221596007-1024x1024.jpg",
    alt: "Police officer on duty",
    title: "On Duty",
  },
  {
    file: "istockphoto-1480307716-1024x1024.jpg",
    alt: "Law enforcement presence",
    title: "Field Ready",
  },
  {
    file: "istockphoto-477525605-1024x1024.jpg",
    alt: "Police response unit",
    title: "Rapid Unit",
  },
  {
    file: "istockphoto-585601166-1024x1024.jpg",
    alt: "Officer with community",
    title: "Public Trust",
  },
  {
    file: "istockphoto-587937232-1024x1024.jpg",
    alt: "Police patrol moment",
    title: "Patrol Watch",
  },
  {
    file: "policeman-officer-police-man-uniform-female-witness-interview-interviewing-suspected-criminal-policeman-officer-police-man-387013706.webp",
    alt: "Officer interviewing a witness",
    title: "Case Interview",
  },
  {
    file: "nepal-police-laughing_w2x8NYZy8W.jpg",
    alt: "Nepal Police officers",
    title: "Nepal Police",
  },
  {
    file: "npa_2122.jpg",
    alt: "Nepal Police Academy",
    title: "Academy",
  },
  {
    file: "igp-dhiraj-pratap-singh_new1.png",
    alt: "IGP Dhiraj Pratap Singh",
    title: "Leadership",
  },
  {
    file: "digp_dipendra_gc_pp_size.jpg",
    alt: "DIGP Dipendra GC",
    title: "Command",
  },
  {
    file: "Rajesh-Sah-Jaiswal.jpg",
    alt: "Rajesh Sah Jaiswal",
    title: "Service",
  },
  {
    file: "PoojaSingh_20220607160223.jpg",
    alt: "Pooja Singh",
    title: "Officer",
  },
  {
    file: "636d12099c7e80680e0a98b5jpeg.jpg",
    alt: "Police force portrait",
    title: "Force Pride",
  },
  {
    file: "images.jpeg",
    alt: "Safety and protection",
    title: "Protect",
  },
  {
    file: "images (1).jpeg",
    alt: "Community safety",
    title: "Community",
  },
  {
    file: "images (2).jpeg",
    alt: "Emergency readiness",
    title: "Ready",
  },
  {
    file: "images (3).jpeg",
    alt: "Guardian network",
    title: "Guardians",
  },
  {
    file: "thumb.jpeg",
    alt: "Surakshya safety visual",
    title: "Surakshya",
  },
];

const CARDS: Card[] = LOGIN_IMAGES.map((item, index) => ({
  id: String(index + 1),
  imageUrl: `/login-images/${encodeURIComponent(item.file)}`,
  alt: item.alt,
  title: item.title,
}));

/* =========================
   Starfield Background
   ========================= */

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    camera.position.z = 10;

    const setSize = (width: number, height: number) => {
      const w = Math.max(width, 1);
      const h = Math.max(height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    setSize(container.clientWidth, container.clientHeight);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0 bg-black"
      aria-hidden="true"
    />
  );
}

/* =========================
   Floating Card
   ========================= */

function FloatingCard({
  card,
  position,
  onSelect,
  onHover,
}: {
  card: Card;
  position: {
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  onSelect: (card: Card) => void;
  onHover: (card: Card | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(card.imageUrl);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(card);
  };
  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    onHover(card);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
    document.body.style.cursor = "auto";
  };

  const scale = hovered ? 1.1 : 1;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      scale={[scale, scale, scale]}
    >
      <Plane
        args={[2.35, 3.15]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial map={texture} toneMapped={false} />
      </Plane>

      <Plane args={[2.48, 3.28]} position={[0, 0, -0.015]}>
        <meshBasicMaterial
          color={hovered ? ACCENT : "#1a1a1a"}
          toneMapped={false}
        />
      </Plane>
    </group>
  );
}

/* =========================
   Card Modal
   ========================= */

function CardModal({
  selectedCard,
  onClose,
}: {
  selectedCard: Card | null;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!selectedCard) return null;

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out";
      cardRef.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  };

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-md w-full mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[16px] bg-[#1F2121] p-4 transition-all duration-500 ease-out w-full"
            style={{
              transformStyle: "preserve-3d",
              boxShadow:
                "rgba(0, 0, 0, 0.01) 0px 520px 146px 0px, rgba(0, 0, 0, 0.04) 0px 333px 133px 0px, rgba(0, 0, 0, 0.26) 0px 83px 83px 0px, rgba(0, 0, 0, 0.29) 0px 21px 46px 0px",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="relative w-full mb-4"
              style={{ aspectRatio: "3 / 4" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="eager"
                className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
                style={{
                  boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                  opacity: 1,
                }}
              />
            </div>

            <h3 className="text-white text-lg font-semibold text-center">
              {selectedCard.title}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Card Galaxy
   ========================= */

function CardGalaxy({
  cards,
  onSelect,
  onHover,
}: {
  cards: Card[];
  onSelect: (card: Card) => void;
  onHover: (card: Card | null) => void;
}) {
  // Hollow orbital rings: cards never occupy the brand corridor.
  const cardPositions = useMemo(() => {
    const positions: {
      x: number;
      y: number;
      z: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
    }[] = [];
    const numCards = cards.length;
    const rings = 4;
    const keepOut = 11;

    for (let i = 0; i < numCards; i++) {
      const ring = i % rings;
      const indexInRing = Math.floor(i / rings);
      const cardsInRing = Math.ceil(numCards / rings);
      const angle =
        (indexInRing / cardsInRing) * Math.PI * 2 + ring * 0.38;
      const radius = 17 + ring * 3.6;
      const ySpread = ((i % 9) - 4) * 1.55 + (ring - 1.5) * 0.6;

      let x = Math.cos(angle) * radius;
      let y = ySpread;
      let z = Math.sin(angle) * radius;

      const radial = Math.hypot(x, y);
      if (radial < keepOut) {
        const push = keepOut / Math.max(radial, 0.001);
        x *= push;
        y *= push * 0.85;
      }

      positions.push({
        x,
        y,
        z,
        rotationX: 0,
        rotationY: angle,
        rotationZ: 0,
      });
    }
    return positions;
  }, [cards.length]);

  return (
    <group>
      <Sphere args={[9.5, 48, 48]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={0.035}
          wireframe
          depthWrite={false}
        />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard
          key={card.id}
          card={card}
          position={cardPositions[i]}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

/* =========================
   Page/Component Export
   ========================= */

export default function StellarCardGallerySingle({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden bg-black"
      style={{ zIndex: selectedCard ? 40 : 0 }}
    >
      <StarfieldBackground />

      <Canvas
        camera={{ position: [0, 1.2, 28], fov: 42 }}
        className="absolute inset-0 z-10"
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement.style.pointerEvents = "auto";
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <pointLight position={[12, 8, 10]} intensity={0.55} />
          <pointLight position={[-10, -6, -8]} intensity={0.28} />
          <CardGalaxy
            cards={CARDS}
            onSelect={setSelectedCard}
            onHover={setHoveredCard}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            enableRotate
            minDistance={22}
            maxDistance={40}
            minPolarAngle={Math.PI * 0.32}
            maxPolarAngle={Math.PI * 0.68}
            autoRotate
            autoRotateSpeed={0.35}
            rotateSpeed={0.45}
            zoomSpeed={0.7}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>

      {/* Center vignette keeps brand readable over the orbital field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          background:
            "radial-gradient(ellipse 42% 36% at 50% 48%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 42%, rgba(0,0,0,0) 72%)",
        }}
      />

      {children ? (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {children}
        </div>
      ) : null}

      {/* Single screen-space label — avoids 3D Html title collisions while orbiting */}
      {hoveredCard && !selectedCard ? (
        <div
          className="pointer-events-none absolute bottom-14 left-1/2 z-30 -translate-x-1/2"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(8,8,8,0.82)",
            border: "1px solid rgba(204,34,51,0.45)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            className="m-0 text-center text-sm font-medium tracking-wide text-white"
            style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
          >
            {hoveredCard.title}
          </p>
        </div>
      ) : null}

      <CardModal
        selectedCard={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
