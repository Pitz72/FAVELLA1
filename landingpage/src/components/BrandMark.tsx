// Emblema del marchio FAVELLA 1 (libro + graffe + scintilla) con alone e
// fiamma ambra che pulsa. Usa il logo ufficiale da Branding2026.
import logo from "../assets/logo.png";

interface Props {
  size?: number;
  glow?: boolean;
  rings?: boolean;
  className?: string;
}

const BrandMark = ({ size = 96, glow = true, rings = false, className = "" }: Props) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <>
          {/* alone ciano-smeraldo */}
          <span
            className="absolute inset-0 rounded-full blur-2xl opacity-60"
            style={{ background: "radial-gradient(circle, rgba(45,212,191,0.55), transparent 70%)" }}
          />
          {/* fiamma ambra che pulsa, in basso al centro */}
          <span
            className="absolute left-1/2 bottom-[14%] -translate-x-1/2 w-1/3 h-1/3 rounded-full blur-xl animate-flame-flicker"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.85), transparent 70%)" }}
          />
        </>
      )}
      {rings && (
        <>
          <span className="absolute inset-0 rounded-full border border-favella-cyan/30 animate-ring-pulse" />
          <span className="absolute inset-0 rounded-full border border-favella-emerald/20 animate-ring-pulse" style={{ animationDelay: "1.2s" }} />
        </>
      )}
      <img
        src={logo}
        alt="FAVELLA 1"
        className="relative z-10 w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(34,211,238,0.35)]"
        draggable={false}
      />
    </div>
  );
};

export default BrandMark;
