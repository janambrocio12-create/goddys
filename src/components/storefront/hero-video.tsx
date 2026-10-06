/**
 * Home hero background: a full-bleed photo, darkened a little so the logo
 * and button stay readable. A smaller file is used on phones.
 */
export function HeroVideo() {
  return (
    <>
      <div className="hero-photo absolute inset-0" />
      <div className="absolute inset-0 bg-black/30" />
    </>
  );
}
