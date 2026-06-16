"use client";

type NewsTickerProps = {
  text: string;
};

export function NewsTicker({ text }: NewsTickerProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-abc-charcoal py-2">
      <div className="ticker-track whitespace-nowrap text-sm text-white sm:text-base">
        <span className="inline-block px-6">{text}</span>
        <span className="inline-block px-4 text-abc-orange">●</span>
        <span className="inline-block px-6">{text}</span>
        <span className="inline-block px-4 text-abc-orange">●</span>
      </div>
    </div>
  );
}
