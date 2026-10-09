import { Spinner } from "@/components/ui/Feedback";

// Shown while a dashboard page loads its data.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-canvas py-24 text-brand" role="status">
      <Spinner className="size-8" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
