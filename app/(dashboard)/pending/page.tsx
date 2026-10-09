import LogoutButton from "@/components/LogoutButton";
import { CARD, PAGE } from "@/components/ui/styles";

// Screen 7: shown to a Site Manager until Direction assigns a site.
export default function PendingPage() {
  return (
    <div className={PAGE}>
      <header className="flex items-center justify-between bg-brand-dark px-6 py-3 text-white">
        <span className="font-bold">EnerTrack</span>
        <span className="text-sm">Site Manager · Pending</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className={`${CARD} w-full max-w-md p-8 text-center`}>
          <h1 className="mb-3 text-xl font-semibold text-ink">Account created</h1>
          <p className="text-sm text-muted">Waiting for a site assignment by an administrator.</p>
          <p className="mb-6 text-sm text-muted">You will get access as soon as a site is assigned to you.</p>
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
