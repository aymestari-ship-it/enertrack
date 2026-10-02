import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ReadingForm from "@/components/ReadingForm";
import { createClient } from "@/lib/supabase/server";
import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";

type Reading = {
  id: string;
  energy_type: string;
  value: number;
  date: string;
};

// Screen 3: My Site (Site Manager).
export default async function MySitePage() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("site_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.site_id) redirect("/pending");

  const [{ data: site }, { data: readings, error }] = await Promise.all([
    supabase.from("sites").select("name, location").eq("id", profile.site_id).maybeSingle(),
    supabase
      .from("readings")
      .select("id, energy_type, value, date")
      .eq("site_id", profile.site_id)
      .order("date", { ascending: false })
      .order("energy_type"),
  ]);

  // Matches the database's current_date (UTC), used by CHECK (date <= current_date).
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-1 flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between bg-teal-700 px-6 py-3 text-white">
        <span className="font-bold">EnerTrack</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">Site Manager · My Site</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">
          {site?.name ?? "My site"}
          {site?.location && (
            <span className="ml-2 text-base font-normal text-neutral-600">{site.location}</span>
          )}
        </h1>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <section className="rounded border border-neutral-300 bg-neutral-100 p-5">
            <ReadingForm today={today} />
          </section>

          <section className="rounded border border-neutral-300 bg-neutral-100 p-5">
            <h2 className="mb-3 font-bold">Readings</h2>

            {error ? (
              <p className="text-sm text-red-600">Readings could not be loaded.</p>
            ) : !readings?.length ? (
              <p className="text-sm text-neutral-600">No readings yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="py-2">Date</th>
                    <th className="py-2">Energy type</th>
                    <th className="py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(readings as Reading[]).map((r) => (
                    <tr key={r.id} className="border-b border-neutral-200">
                      <td className="py-2">{r.date}</td>
                      <td className="py-2 capitalize">{r.energy_type}</td>
                      <td className="py-2 text-right tabular-nums">
                        {Number(r.value).toLocaleString("en")}{" "}
                        {isEnergyType(r.energy_type) ? ENERGY_UNITS[r.energy_type] : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
