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

const CARDS: Card[] = [
  { id: "1", imageUrl: "/gallery/card-1.jpg", alt: "Safety wearable on wrist", title: "SOS Wristband" },
  { id: "2", imageUrl: "/gallery/card-2.jpg", alt: "Emergency response lights", title: "Rapid Dispatch" },
  { id: "3", imageUrl: "/images/craft.jpg", alt: "Crafted protection device", title: "Stay Protected" },
  { id: "4", imageUrl: "/gallery/card-4.jpg", alt: "Phone with alert notification", title: "Instant Alert" },
  { id: "5", imageUrl: "/gallery/card-5.jpg", alt: "Hands reaching to help", title: "Guardian Link" },
  { id: "6", imageUrl: "/gallery/card-6.jpg", alt: "Fingerprint security scanner", title: "Trusted Access" },
  { id: "7", imageUrl: "/gallery/card-7.jpg", alt: "Digital security lock", title: "Secure Channel" },
  { id: "8", imageUrl: "/images/social-1.jpg", alt: "Community safety moments", title: "Night Patrol" },
  { id: "9", imageUrl: "/gallery/card-9.jpg", alt: "Live monitoring screens", title: "Live Location" },
  { id: "10", imageUrl: "/gallery/card-10.jpg", alt: "Family outdoors together", title: "Family Circle" },
  { id: "11", imageUrl: "/gallery/card-11.jpg", alt: "Security professional on duty", title: "Police Ready" },
  { id: "12", imageUrl: "/images/philosophy.jpg", alt: "Care and protection philosophy", title: "Care Network" },
  { id: "13", imageUrl: "/gallery/card-13.jpg", alt: "Emergency phone call", title: "One-Tap SOS" },
  { id: "14", imageUrl: "/gallery/card-14.jpg", alt: "Incident tracking dashboard", title: "Incident Trace" },
  { id: "15", imageUrl: "/gallery/card-15.jpg", alt: "Person walking safely in the city", title: "Safe Commute" },
  { id: "16", imageUrl: "/images/footer-parallax.jpg", alt: "Wide coverage landscape", title: "Coverage Map" },
  { id: "17", imageUrl: "/gallery/card-17.jpg", alt: "Handshake of trust", title: "Verified Trust" },
  { id: "18", imageUrl: "/gallery/card-18.jpg", alt: "Padlock representing data protection", title: "Data Shield" },
  { id: "19", imageUrl: "/gallery/card-19.jpg", alt: "Online support and guidance", title: "Always Watching" },
  { id: "20", imageUrl: "/images/social-2.jpg", alt: "Team collaborating on safety", title: "Response Team" },
  { id: "21", imageUrl: "/gallery/card-21.jpg", alt: "Urban skyline at dusk", title: "Urban Safety" },
  { id: "22", imageUrl: "/gallery/card-22.jpg", alt: "Fitness tracking wearable", title: "Wear & Trust" },
  { id: "23", imageUrl: "/gallery/card-23.jpg", alt: "Professional ready for action", title: "On Call Guard" },
  { id: "24", imageUrl: "/gallery/card-24.jpg", alt: "Community hands joined together", title: "Ward Network" },
  { id: "25", imageUrl: "/gallery/card-25.jpg", alt: "Global Earth connection", title: "Nationwide Reach" },
  { id: "26", imageUrl: "/gallery/card-26.jpg", alt: "Cyber protection abstract", title: "Threat Block" },
  { id: "27", imageUrl: "/gallery/card-27.jpg", alt: "Quiet night landscape", title: "Silent Shield" },
  { id: "28", imageUrl: "/images/social-3.jpg", alt: "Coordination and response", title: "Command Sync" },
  { id: "29", imageUrl: "/gallery/card-29.jpg", alt: "Safe home exterior", title: "Home Safe" },
  { id: "30", imageUrl: "/gallery/card-30.jpg", alt: "Authoritative professional presence", title: "Authority Link" },
  { id: "31", imageUrl: "/gallery/card-31.jpg", alt: "Mobile safety app in hand", title: "App + Band" },
  { id: "32", imageUrl: "/gallery/card-32.jpg", alt: "Evidence and case documents", title: "Case Ledger" },
  { id: "33", imageUrl: "/gallery/card-33.jpg", alt: "Emergency beacon signal", title: "Beacon Pulse" },
  { id: "34", imageUrl: "/gallery/card-34.jpg", alt: "Police coordination center", title: "Control Desk" },
  { id: "35", imageUrl: "/gallery/card-35.jpg", alt: "Protected walking path", title: "Guided Path" },
  { id: "36", imageUrl: "/gallery/card-36.jpg", alt: "SOS countdown timer", title: "Countdown SOS" },
  { id: "37", imageUrl: "/gallery/card-37.jpg", alt: "Guardian notification feed", title: "Guardian Ping" },
  { id: "38", imageUrl: "/gallery/card-38.jpg", alt: "Encrypted message channel", title: "Silent Cipher" },
  { id: "39", imageUrl: "/gallery/card-39.jpg", alt: "Street CCTV coverage", title: "Street Watch" },
  { id: "40", imageUrl: "/gallery/card-40.jpg", alt: "Volunteer safety network", title: "Citizen Guard" },
  { id: "41", imageUrl: "/gallery/card-41.jpg", alt: "Ambulance and first response", title: "First Response" },
  { id: "42", imageUrl: "/gallery/card-42.jpg", alt: "School route protection", title: "School Shield" },
  { id: "43", imageUrl: "/gallery/card-43.jpg", alt: "Women safety support line", title: "She Safe" },
  { id: "44", imageUrl: "/gallery/card-44.jpg", alt: "Offline emergency cache", title: "Offline Ready" },
  { id: "45", imageUrl: "/gallery/card-45.jpg", alt: "GPS distress track", title: "Distress Track" },
  { id: "46", imageUrl: "/gallery/card-46.jpg", alt: "Neighborhood watch relay", title: "Neighbor Net" },
  { id: "47", imageUrl: "/gallery/card-47.jpg", alt: "24/7 monitoring room", title: "Always Online" },
  { id: "48", imageUrl: "/gallery/card-48.jpg", alt: "Biometric user verify", title: "Identity Lock" },
  { id: "49", imageUrl: "/gallery/card-49.jpg", alt: "Campus emergency hotline", title: "Campus Alert" },
  { id: "50", imageUrl: "/gallery/card-50.jpg", alt: "Transit passenger safety", title: "Transit Guard" },
  { id: "51", imageUrl: "/gallery/card-51.jpg", alt: "Elder care check-in", title: "Elder Watch" },
  { id: "52", imageUrl: "/gallery/card-52.jpg", alt: "Geo-fence safety zone", title: "Safe Zone" },
  { id: "53", imageUrl: "/gallery/card-53.jpg", alt: "Panic button trigger", title: "Panic Pulse" },
  { id: "54", imageUrl: "/gallery/card-54.jpg", alt: "Multi guardian cascade", title: "Cascade Call" },
  { id: "55", imageUrl: "/gallery/card-55.jpg", alt: "Evidence photo capture", title: "Evidence Snap" },
  { id: "56", imageUrl: "/gallery/card-56.jpg", alt: "Voice distress note", title: "Voice Mayday" },
  { id: "57", imageUrl: "/gallery/card-57.jpg", alt: "Station dispatch board", title: "Station Board" },
  { id: "58", imageUrl: "/gallery/card-58.jpg", alt: "Highway patrol assist", title: "Highway Assist" },
  { id: "59", imageUrl: "/gallery/card-59.jpg", alt: "Dark street lighting map", title: "Light the Path" },
  { id: "60", imageUrl: "/gallery/card-60.jpg", alt: "Trusted contact ring", title: "Trust Ring" },
  { id: "61", imageUrl: "/gallery/card-61.jpg", alt: "Device battery health", title: "Band Health" },
  { id: "62", imageUrl: "/gallery/card-62.jpg", alt: "Incident timeline log", title: "Timeline Log" },
  { id: "63", imageUrl: "/gallery/card-63.jpg", alt: "Municipal partner link", title: "City Partner" },
  { id: "64", imageUrl: "/gallery/card-64.jpg", alt: "Secure role handoff", title: "Role Handoff" },
  { id: "65", imageUrl: "/gallery/card-65.jpg", alt: "Suraksha full circle", title: "Full Circle" },
];

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
