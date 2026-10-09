import Image from "next/image";

// EnerTrack logo. Icon: public/enertrack-logo.svg (also app/icon.svg).
// "header": 32 px icon with a light ring (it sits on the dark brand header) + white wordmark.
// "full": public/enertrack-logo-full.svg, wordmark converted to paths, for login / sign-up.
export default function Logo({ variant = "header" }: { variant?: "header" | "full" }) {
  if (variant === "full") {
    return (
      <Image
        src="/enertrack-logo-full.svg"
        alt="EnerTrack"
        width={258}
        height={64}
        priority
        className="h-12 w-auto"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/enertrack-logo.svg"
        alt=""
        width={32}
        height={32}
        priority
        className="rounded-lg ring-1 ring-white/25"
      />
      <span className="text-lg font-semibold tracking-tight text-white">EnerTrack</span>
    </span>
  );
}
