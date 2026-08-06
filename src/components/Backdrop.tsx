/**
 * Fixed, non-interactive atmosphere layer: grid, radial bloom, scanline sweep,
 * vignette and film grain. Pure CSS — no JS, no canvas, no paint cost per frame
 * beyond compositor transforms.
 */
export default function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-void" />

      {/* primary red grid */}
      <div className="grid-bg absolute inset-0 opacity-70" />

      {/* fine secondary grid, masked to the centre */}
      <div
        className="grid-bg-fine absolute inset-0 opacity-40"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent 75%)',
        }}
      />

      {/* drifting crimson blooms */}
      <div
        className="animate-drift absolute -top-1/4 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full opacity-45 blur-[110px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255,45,75,0.30) 0%, rgba(143,13,36,0.12) 45%, transparent 70%)',
        }}
      />
      <div
        className="animate-drift absolute -bottom-1/3 -left-1/4 h-[60vh] w-[60vw] rounded-full opacity-30 blur-[130px]"
        style={{
          animationDelay: '-11s',
          background:
            'radial-gradient(circle, rgba(143,13,36,0.28) 0%, transparent 68%)',
        }}
      />

      {/* horizon line */}
      <div className="absolute inset-x-0 top-[62vh] h-px bg-gradient-to-r from-transparent via-red-deep/45 to-transparent" />

      {/* CRT sweep */}
      <div className="animate-scan absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-red-blood/[0.045] to-transparent" />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 85% at 50% 45%, transparent 30%, rgba(6,7,10,0.55) 72%, rgba(6,7,10,0.94) 100%)',
        }}
      />

      {/* grain */}
      <div className="noise absolute inset-0 opacity-[0.16] mix-blend-soft-light" />
    </div>
  );
}
