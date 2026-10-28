import {
  Crown, Medal, Cpu, Palette, Gamepad2, Theater, Music, Book,
  FlaskConical, Leaf, Globe, Camera, Trophy, Footprints, Moon, Hammer,
  Pencil, Users, Star, GraduationCap, Monitor, Atom, Mic, Heart,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  crown: Crown,
  medal: Medal,
  cpu: Cpu,
  palette: Palette,
  "gamepad-2": Gamepad2,
  theater: Theater,
  music: Music,
  book: Book,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  globe: Globe,
  camera: Camera,
  trophy: Trophy,
  "person-running": Footprints,
  moon: Moon,
  hammer: Hammer,
  pencil: Pencil,
  users: Users,
  star: Star,
  "graduation-cap": GraduationCap,
  monitor: Monitor,
  atom: Atom,
  mic: Mic,
  heart: Heart,
};

interface ClubIconProps {
  colorHex: string;
  iconName?: string;
  size?: number;
  className?: string;
  /** Use on colored backgrounds — frosted glass instead of solid club color */
  glass?: boolean;
}

export default function ClubIcon({ colorHex, iconName = "users", size = 40, className = "", glass = false }: ClubIconProps) {
  const Icon = ICON_MAP[iconName] ?? Users;
  const iconSize = Math.round(size * 0.52);

  const style = glass
    ? { width: size, height: size, backgroundColor: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.35)" }
    : { width: size, height: size, backgroundColor: `#${colorHex}` };

  return (
    <div
      className={`flex items-center justify-center rounded-2xl flex-shrink-0 ${className}`}
      style={style}
    >
      <Icon size={iconSize} color="white" strokeWidth={2} />
    </div>
  );
}
