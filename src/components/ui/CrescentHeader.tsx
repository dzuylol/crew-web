interface CrescentHeaderProps {
  title: string;
  color: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function CrescentHeader({ title, color, subtitle, children }: CrescentHeaderProps) {
  return (
    <div
      className="crescent-header relative px-5 pt-12 pb-16 text-white"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm opacity-80">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
