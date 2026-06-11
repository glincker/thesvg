// Inlined so the stroke can use currentColor. Orange fill is the brand
// signature and stays orange in both themes.
export function TheSVGMark({
  className,
  title = "theSVG",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      className={className}
    >
      <path d="M7 7 L17 7 L17 17 L7 17 Z" fill="#f97316" stroke="none" />
      <path d="M3 5 A2 2 0 0 1 5 3 L15 3 A2 2 0 0 1 17 5 L17 7 L19 7 A2 2 0 0 1 21 9 L21 19 A2 2 0 0 1 19 21 L9 21 A2 2 0 0 1 7 19 L7 17 L5 17 A2 2 0 0 1 3 15 Z" />
    </svg>
  );
}
