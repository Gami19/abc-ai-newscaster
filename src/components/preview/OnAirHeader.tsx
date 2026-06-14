"use client";

type OnAirHeaderProps = {
  isOnAir: boolean;
  isEnded?: boolean;
};

export function OnAirHeader({ isOnAir, isEnded = false }: OnAirHeaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-abc-orange px-4 py-2 text-white">
      {isEnded ? (
        <span className="text-sm font-bold text-white/80">⚫ OFF AIR</span>
      ) : isOnAir ? (
        <span
          className="animate-pulse text-sm font-bold text-white"
          aria-live="polite"
        >
          🔴 ON AIR
        </span>
      ) : (
        <span className="text-sm font-bold text-white/70">⚫ ON AIR</span>
      )}
      <span className="text-sm font-bold">news おかえり 2035</span>
    </div>
  );
}
