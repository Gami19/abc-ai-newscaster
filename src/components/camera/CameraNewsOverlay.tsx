export function CameraNewsOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col border-4 border-abc-orange"
      aria-hidden
    >
      <div className="bg-abc-orange/80 px-4 py-2 text-center">
        <p className="text-sm font-bold tracking-wide text-white sm:text-base">
          news おかえり 2035 キャスター席
        </p>
      </div>
      <div className="flex-1" />
    </div>
  );
}
