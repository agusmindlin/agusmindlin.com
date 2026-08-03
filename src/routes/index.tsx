import { createFileRoute } from "@tanstack/react-router";
import profileAsset from "@/assets/profile.png.asset.json";
import { Ticket, ArrowUpRight, Pencil, Check, RotateCcw } from "lucide-react";
import { FaYoutube, FaSpotify, FaTiktok, FaInstagram } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useEffect, useRef, useState, type ComponentType, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";

// ============================================================
// CONFIGURACIÓN — Editá acá tu contenido
// ============================================================

// Tu nombre artístico
const ARTIST_NAME = "Agus Mindlin";

// Para cambiar la foto de perfil:
// reemplazá el archivo en src/assets/profile.jpg
// (o cambiá el import de arriba a otro archivo)
const PROFILE_IMAGE = profileAsset.url;

// Reencuadre manual de la foto de perfil.
// Ajustá estos valores para mover el recorte dentro del círculo:
//   PROFILE_POSITION: "50% 30%" → horizontal vertical (0% = izquierda/arriba, 100% = derecha/abajo)
//   PROFILE_SCALE: 1 = sin zoom, 1.2 = 20% más zoom, etc.
const PROFILE_POSITION = "76% 0%";
const PROFILE_SCALE = 1;

// Modo editor: el botón de editar el encuadre sólo aparece para vos.
// Para activarlo en tu navegador, visitá la página una vez con `?edit=mindlin`
// (queda guardado en localStorage). Para desactivarlo: `?edit=off`.
const EDITOR_TOKEN = "mindlin";

type IconCmp = IconType | ComponentType<{ className?: string }>;

type LinkBlock = {
  label: string;
  hint?: string;
  href: string;
  icon: IconCmp;
  iconColor?: string; // color del logo (opcional)
  hidden?: boolean;   // poné true para ocultar este bloque
};

// Para agregar un link: copiá un bloque y editalo.
// Para ocultar un link: agregale `hidden: true`.
// Para cambiar el orden: movelos en la lista.
const newReleases: LinkBlock[] = [
  {
    label: "Live Session en La Cuerda Mecánica",
    hint: "Videos completos!",
    href: "https://youtube.com/playlist?list=PLdziZM6axkVw&si=HKnPbOV8Dc76WCjf",
    icon: FaYoutube,
    iconColor: "#FF0000",
  },
];

const liveDates: LinkBlock[] = [
  {
    label: "Entradas 6 de Agosto",
    hint: "Compra tu entrada",
    href: "https://labibliotecacafe.com.ar/event/119600-clasicos-del-jazz-por-agus-mindlin",
    icon: Ticket,
    iconColor: "#FACC15",
  },
];

const relevantLinks: LinkBlock[] = [
  {
    label: "Canal de Youtube",
    hint: "Suscribite!",
    href: "https://www.youtube.com/@agusmindlin",
    icon: FaYoutube,
    iconColor: "#FF0000",
  },
  {
    label: "Sesión en vivo",
    hint: "YouTube",
    href: "#",
    icon: FaYoutube,
    iconColor: "#FF0000",
    hidden: true,
  },
  {
    label: "Último single",
    hint: "YouTube",
    href: "#",
    icon: FaYoutube,
    iconColor: "#FF0000",
    hidden: true,
  },
  {
    label: "Perfil de Spotify",
    hint: "Seguime!",
    href: "https://open.spotify.com/artist/6BZZBcgWgRBRUk4NnnAXZL?si=4LyDxoioSs2y_r_oVjrUVg",
    icon: FaSpotify,
    iconColor: "#1DB954",
  },
  {
    label: "TikTok",
    hint: "@agusmindlin",
    href: "https://www.tiktok.com/@agusmindlin?is_from_webapp=1&sender_device=pc",
    icon: FaTiktok,
    iconColor: "#ffffff",
  },
  {
    label: "Instagram",
    hint: "@agusmindlin",
    href: "https://www.instagram.com/agusmindlin/",
    icon: FaInstagram,
    iconColor: "#E1306C",
  },
  {
    label: "Entradas próximo show",
    hint: "Reservá tu lugar",
    href: "#",
    icon: Ticket,
    hidden: true,
  },
];

// ============================================================

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${ARTIST_NAME} — Links relevantes` },
      { name: "description", content: `Links oficiales de ${ARTIST_NAME}: música, videos y entradas.` },
      { property: "og:title", content: `${ARTIST_NAME} — Links relevantes` },
      { property: "og:description", content: `Música, videos y entradas de ${ARTIST_NAME}.` },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "profile-frame-v1";

function parsePosition(p: string): { x: number; y: number } {
  const m = p.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ProfileFrame() {
  const initial = parsePosition(PROFILE_POSITION);
  const [pos, setPos] = useState<{ x: number; y: number }>(initial);
  const [scale, setScale] = useState<number>(PROFILE_SCALE);
  const [editing, setEditing] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);
  const pinchRef = useRef<{ pointers: Map<number, { x: number; y: number }>; startDist: number; startScale: number } | null>(null);

  // Detectar modo editor (sólo para vos): ?edit=<token> lo activa, ?edit=off lo apaga.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const edit = params.get("edit");
      if (edit === EDITOR_TOKEN) localStorage.setItem("is-editor", "1");
      else if (edit === "off") localStorage.removeItem("is-editor");
      setIsEditor(localStorage.getItem("is-editor") === "1");
    } catch {}
  }, []);

  // Load saved frame
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { x: number; y: number; scale: number };
        if (typeof saved.x === "number" && typeof saved.y === "number" && typeof saved.scale === "number") {
          setPos({ x: saved.x, y: saved.y });
          setScale(saved.scale);
        }
      }
    } catch {}
  }, []);

  const persist = (next: { x: number; y: number; scale: number }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!editing) return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (!pinchRef.current) {
      pinchRef.current = { pointers: new Map(), startDist: 0, startScale: scale };
    }
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values());
      pinchRef.current.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current.startScale = scale;
      dragRef.current = null;
    } else {
      dragRef.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    }
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!editing) return;
    if (pinchRef.current?.pointers.has(e.pointerId)) {
      pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinchRef.current && pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchRef.current.startDist > 0) {
        const next = clamp(pinchRef.current.startScale * (dist / pinchRef.current.startDist), 1, 5);
        setScale(next);
      }
      return;
    }
    if (!dragRef.current || dragRef.current.id !== e.pointerId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setPos((p) => ({
      x: clamp(p.x - (dx / rect.width) * 100 / scale, 0, 100),
      y: clamp(p.y - (dy / rect.height) * 100 / scale, 0, 100),
    }));
  };

  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    pinchRef.current?.pointers.delete(e.pointerId);
    if (pinchRef.current && pinchRef.current.pointers.size < 2) {
      pinchRef.current.startDist = 0;
    }
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  const onWheel = (e: RWheelEvent<HTMLDivElement>) => {
    if (!editing) return;
    e.preventDefault();
    setScale((s) => clamp(s + (e.deltaY < 0 ? 0.08 : -0.08), 1, 5));
  };

  const save = () => {
    persist({ x: pos.x, y: pos.y, scale });
    setEditing(false);
  };

  const reset = () => {
    setPos(initial);
    setScale(PROFILE_SCALE);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-accent/20 blur-xl" aria-hidden />
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          className={`relative h-40 w-40 overflow-hidden rounded-full ring-1 shadow-lg select-none touch-none ${
            editing ? "ring-2 ring-accent cursor-grab active:cursor-grabbing" : "ring-border"
          }`}
        >
          <img
            src={PROFILE_IMAGE}
            alt={ARTIST_NAME}
            width={160}
            height={160}
            draggable={false}
            className="h-full w-full object-cover pointer-events-none"
            style={{
              objectPosition: `${pos.x}% ${pos.y}%`,
              transform: `scale(${scale})`,
              transformOrigin: "center",
            }}
          />
          {editing && (
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
          )}
        </div>
        {isEditor && (
          <button
            type="button"
            onClick={() => (editing ? save() : setEditing(true))}
            aria-label={editing ? "Guardar encuadre" : "Editar encuadre"}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-md transition-colors hover:bg-secondary"
          >
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Arrastrá · Rueda o pellizco para zoom
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/80">
            x:{pos.x.toFixed(1)}% · y:{pos.y.toFixed(1)}% · zoom:{scale.toFixed(2)}
          </p>
          <div className="flex items-center gap-3 w-56">
            <span className="text-[10px] text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-accent"
            />
            <button
              type="button"
              onClick={reset}
              aria-label="Restablecer"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkCard({ link }: { link: LinkBlock }) {
  const Icon = link.icon;
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-3.5 backdrop-blur-sm transition-all hover:bg-card hover:border-accent/40 hover:-translate-y-0.5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary/60 transition-colors">
        <Icon
          className="h-4 w-4"
          style={link.iconColor ? { color: link.iconColor } : undefined}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground truncate">
          {link.label}
        </span>
        {link.hint && (
          <span className="block text-xs text-muted-foreground truncate">
            {link.hint}
          </span>
        )}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

function LinkSection({ title, items }: { title: string; items: LinkBlock[] }) {
  const visible = items.filter((l) => !l.hidden);
  if (visible.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
        {title}
      </h2>
      <ul className="space-y-2.5">
        {visible.map((link) => (
          <li key={link.label}>
            <LinkCard link={link} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Index() {
  return (
    <main className="min-h-screen flex items-start sm:items-center justify-center px-5 py-16 sm:py-20">
      <div className="w-full max-w-sm">
        <header className="flex flex-col items-center text-center">
          <ProfileFrame />
          <h1 className="mt-6 text-2xl font-medium text-foreground">{ARTIST_NAME}</h1>
        </header>

        <LinkSection title="Fechas en vivo" items={liveDates} />
        <LinkSection title="Nuevos lanzamientos" items={newReleases} />
        <LinkSection title="Links relevantes" items={relevantLinks} />

        <footer className="mt-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            © {new Date().getFullYear()} {ARTIST_NAME}
          </p>
        </footer>
      </div>
    </main>
  );
}
