// Inlined so the stroke follows currentColor. The orange element is the family signature and stays orange.
const ORANGE = "#f97316";

/** theSVG's own mark, two interlocking squares around an orange core. For the brand icons side. */
export function TheSVGMark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="theSVG brand icons" className={className}>
      <path d="M7 7 L17 7 L17 17 L7 17 Z" fill={ORANGE} stroke="none" />
      <path d="M3 5 A2 2 0 0 1 5 3 L15 3 A2 2 0 0 1 17 5 L17 7 L19 7 A2 2 0 0 1 21 9 L21 19 A2 2 0 0 1 19 21 L9 21 A2 2 0 0 1 7 19 L7 17 L5 17 A2 2 0 0 1 3 15 Z" />
    </svg>
  );
}

/**
 * The UI icons mark: one square cut along its diagonal, the halves pulled apart. One half is an outline, the other
 * solid orange, so it reads as "one shape, every look" and carries our 45 degree cut. Same grammar as the brand
 * mark (outline plus orange), so the two read as one family. Drawn inside the same 3 to 21 box as the brand mark, so the
 * two have the same footprint and swapping them never makes the logo jump in size.
 */
export function UiMark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="theSVG UI icons" className={className}>
      <path d="M3 3H18.79L3 18.79Z" />
      <path d="M21 5.21V21H5.21Z" fill={ORANGE} stroke={ORANGE} />
    </svg>
  );
}
