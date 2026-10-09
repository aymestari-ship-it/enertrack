import Image from "next/image";

// EnerTrack logo: the app icon (public/enertrack-logo.svg) + wordmark.
// "header": 32 px icon, white wordmark for the brand header.
// "full": public/enertrack-logo-full.svg (icon + two-tone wordmark) for login / sign-up.
export default function Logo({ variant = "header" }: { variant?: "header" | "full" }) {
  if (variant === "full") {
    // public/enertrack-logo-full.svg (270x64). Its wordmark is SVG <text>: inside <img> it
    // uses the visitor's installed fonts (Inter, else Helvetica Neue / Arial).
    return (
      <Image
        src="/enertrack-logo-full.svg"
        alt="EnerTrack"
        width={270}
        height={64}
        priority
        className="h-12 w-auto"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/enertrack-logo.svg" alt="" width={32} height={32} priority />
      <span className="text-lg font-semibold tracking-tight text-white">EnerTrack</span>
    </span>
  );
}
