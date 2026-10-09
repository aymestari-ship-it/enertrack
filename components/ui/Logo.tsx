// EnerTrack mark (decorative) + wordmark. `onDark` for the brand header.
export default function Logo({ onDark = false, size = "md" }: { onDark?: boolean; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-10" : "size-8";
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`${box} inline-flex shrink-0 items-center justify-center rounded-lg ${
          onDark ? "bg-white/15 text-white" : "bg-brand text-white"
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <path d="M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-5.6L13.5 2Z" />
        </svg>
      </span>
      <span className={`${text} font-semibold tracking-tight ${onDark ? "text-white" : "text-ink"}`}>
        EnerTrack
      </span>
    </span>
  );
}
