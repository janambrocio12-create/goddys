const SLICES_PER_SIDE = 7;
const HALF_DEPTH_PX = 16;

/**
 * The brand logo, spinning in 3D. Purely decorative - the page's real
 * heading is the visually hidden h1 next to it - so it's hidden from
 * assistive tech.
 *
 * The flat logo is stacked into thin dimmed slices so it reads as a solid
 * piece with an edge instead of a paper-thin card. Each half of the stack
 * only draws while it faces the viewer (backface-visibility), and the back
 * half is turned around, so the logo reads correctly from both sides
 * instead of showing a mirrored ghost behind it.
 */
export function HeroLogo() {
  const sliceOffsets = Array.from(
    { length: SLICES_PER_SIDE },
    (_, i) => (HALF_DEPTH_PX * (i + 1)) / (SLICES_PER_SIDE + 1),
  );

  return (
    <div className="hero-logo-stage" aria-hidden="true">
      <div className="hero-logo-spin">
        {sliceOffsets.map((offset) => (
          <div
            key={`front-${offset}`}
            className="hero-logo-face hero-logo-slice"
            style={{ transform: `translateZ(${offset}px)` }}
          />
        ))}
        {sliceOffsets.map((offset) => (
          <div
            key={`back-${offset}`}
            className="hero-logo-face hero-logo-slice"
            style={{ transform: `translateZ(${-offset}px) rotateY(180deg)` }}
          />
        ))}
        <div className="hero-logo-face" style={{ transform: `translateZ(${HALF_DEPTH_PX}px)` }} />
        <div
          className="hero-logo-face"
          style={{ transform: `translateZ(${-HALF_DEPTH_PX}px) rotateY(180deg)` }}
        />
      </div>
    </div>
  );
}
