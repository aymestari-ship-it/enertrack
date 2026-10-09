import Image from "next/image";

// EnerTrack logo: the app icon (public/enertrack-logo.svg) + wordmark.
// "header": 32 px icon, white wordmark for the brand header.
// "full": larger icon, two-tone wordmark ("Ener" ink, "Track" teal) for login / sign-up.
export default function Logo({ variant = "header" }: { variant?: "header" | "full" }) {
  if (variant === "full") {
    return (
      <span className="inline-flex items-center gap-3">
        <Image src="/enertrack-logo.svg" alt="" width={48} height={48} priority />
        <span className="text-3xl font-bold tracking-tight">
          <span className="text-ink">Ener</span>
          <span className="text-energy-electricity">Track</span>
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/enertrack-logo.svg" alt="" width={32} height={32} priority />
      <span className="text-lg font-semibold tracking-tight text-white">EnerTrack</span>
    </span>
  );
}
