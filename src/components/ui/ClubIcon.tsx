interface ClubIconProps {
  colorHex: string;
  size?: number;
  className?: string;
}

export default function ClubIcon({ colorHex, size = 40, className = "" }: ClubIconProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: `#${colorHex}` }}
    >
      <div
        className="rounded-lg opacity-60"
        style={{ width: size * 0.45, height: size * 0.45, backgroundColor: "white" }}
      />
    </div>
  );
}
