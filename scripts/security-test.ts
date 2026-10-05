// RLS attacker test: plays a real client (supabase-js + publishable key) signed in
// as Site Manager A, and checks that the database refuses what it must refuse.
//
//   npm run test:security
//
// Needs in .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
// TEST_USER_A_EMAIL/PASSWORD, TEST_USER_B_EMAIL/PASSWORD (two Site Managers on two sites).
// Never logs passwords, tokens or emails. Everything it creates is removed in `finally`.

import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

type Profile = { id: string; role: string; site_id: string | null; full_name: string | null };
type Result = { name: string; pass: boolean; detail: string };

// Dates far in the past so they never collide with real readings.
const SEED_DATE = "2020-01-01";
const ATTACK_DATE = "2020-01-02";
const EDIT_DATE = "2020-01-03";
const RUN_ID = `SECURITY-TEST-${Date.now()}`;

const results: Result[] = [];
const cleanups: { label: string; run: () => Promise<void> }[] = [];
const manualCleanup: string[] = [];
const signedIn: SupabaseClient[] = [];

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function newClient() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function describe(error: PostgrestError | null) {
  return error ? `${error.code}: ${error.message}` : "no error";
}

function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

async function signIn(label: string, emailVar: string, passwordVar: string) {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: env(emailVar),
    password: env(passwordVar),
  });
  if (error || !data.user) throw new Error(`Sign-in failed for ${label}: ${error?.message ?? "no user"}`);
  signedIn.push(client);
  return { client, userId: data.user.id };
}

async function readProfile(client: SupabaseClient, id: string): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .select("id, role, site_id, full_name")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(`Cannot read profile: ${describe(error)}`);
  return data as Profile;
}

async function main() {
  const a = await signIn("A", "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
  const b = await signIn("B", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD");

  const profileA = await readProfile(a.client, a.userId);
  const profileB = await readProfile(b.client, b.userId);

  // Preconditions: two assigned Site Managers on two different sites.
  if (profileA.role !== "site_manager" || profileB.role !== "site_manager") {
    throw new Error("A and B must both be site_manager");
  }
  if (!profileA.site_id || !profileB.site_id || profileA.site_id === profileB.site_id) {
    throw new Error("A and B must be assigned to two different sites");
  }
  const siteA = profileA.site_id;
  const siteB = profileB.site_id;

  // Always restore A's and B's profiles if a test managed to change them.
  cleanups.push({
    label: "restore profile A",
    run: async () => {
      const now = await readProfile(a.client, a.userId);
      if (now.full_name !== profileA.full_name) {
        await a.client.from("profiles").update({ full_name: profileA.full_name }).eq("id", a.userId);
      }
      if (now.role !== profileA.role || now.site_id !== profileA.site_id) {
        // Only possible if test 1 or 2 failed (A became direction or moved site).
        const { error } = await a.client
          .from("profiles")
          .update({ role: profileA.role, site_id: profileA.site_id })
          .eq("id", a.userId);
        if (error) manualCleanup.push(`profile A: restore role/site_id manually (${describe(error)})`);
      }
    },
  });
  cleanups.push({
    label: "restore profile B",
    run: async () => {
      const now = await readProfile(b.client, b.userId);
      if (now.full_name !== profileB.full_name) {
        await b.client.from("profiles").update({ full_name: profileB.full_name }).eq("id", b.userId);
      }
    },
  });

  // Seed: B inserts a valid reading so test 4 has something to not see.
  const seedB = await b.client
    .from("readings")
    .insert({ site_id: siteB, energy_type: "water", value: 1, date: SEED_DATE })
    .select("id")
    .single();
  if (seedB.error) {
    throw new Error(`Seed by B failed (${describe(seedB.error)}). A reading may already exist on ${SEED_DATE}; not touching it.`);
  }
  cleanups.push({
    label: "delete B seed reading",
    run: async () => {
      const { error } = await b.client.from("readings").delete().eq("id", seedB.data.id);
      if (error) manualCleanup.push(`readings ${seedB.data.id}: ${describe(error)}`);
    },
  });

  // Seed: A inserts a valid reading on its own site, duplicated in test 7.
  const seedA = await a.client
    .from("readings")
    .insert({ site_id: siteA, energy_type: "water", value: 1, date: SEED_DATE })
    .select("id")
    .single();
  if (seedA.error) {
    throw new Error(`Seed by A failed (${describe(seedA.error)}). A reading may already exist on ${SEED_DATE}; not touching it.`);
  }
  cleanups.push({
    label: "delete A seed reading",
    run: async () => {
      const { error } = await a.client.from("readings").delete().eq("id", seedA.data.id);
      if (error) manualCleanup.push(`readings ${seedA.data.id}: ${describe(error)}`);
    },
  });

  // Seed: a second reading by A on its own site, edited by tests 14-17.
  const ownA = await a.client
    .from("readings")
    .insert({ site_id: siteA, energy_type: "fuel", value: 1, date: EDIT_DATE })
    .select("id")
    .single();
  if (ownA.error) {
    throw new Error(`Seed by A failed (${describe(ownA.error)}). A reading may already exist on ${EDIT_DATE}; not touching it.`);
  }
  cleanups.push({
    label: "delete A editable reading",
    run: async () => {
      // By id. If test 16 failed, the row moved to B's site: only B can delete it then.
      const byA = await a.client.from("readings").delete().eq("id", ownA.data.id).select("id");
      if (byA.data?.length) return;
      const byB = await b.client.from("readings").delete().eq("id", ownA.data.id).select("id");
      if (byB.data?.length) return;
      const still = await b.client.from("readings").select("id").eq("id", ownA.data.id);
      const stillA = await a.client.from("readings").select("id").eq("id", ownA.data.id);
      if (still.data?.length || stillA.data?.length) {
        manualCleanup.push(`readings ${ownA.data.id}: could not delete (${describe(byA.error ?? byB.error)})`);
      }
    },
  });

  // B can see its own seed: proves test 4's empty result means "hidden", not "absent".
  const bSees = await b.client.from("readings").select("id").eq("id", seedB.data.id);
  if (bSees.error || bSees.data.length !== 1) throw new Error("B cannot read its own seed reading");

  console.log(`\nRunning as Site Manager A (run ${RUN_ID})\n`);

  // 1. Own role -> direction: blocked by protect_profile_columns.
  {
    const { data, error } = await a.client
      .from("profiles")
      .update({ role: "direction" })
      .eq("id", a.userId)
      .select("id");
    const after = await readProfile(a.client, a.userId);
    const refused = Boolean(error) || data?.length === 0;
    record(
      "1. A sets own role to 'direction'",
      refused && after.role === profileA.role,
      `${describe(error)} | role after: ${after.role}`
    );
  }

  // 2. Own site_id -> B's site: blocked by protect_profile_columns.
  {
    const { data, error } = await a.client
      .from("profiles")
      .update({ site_id: siteB })
      .eq("id", a.userId)
      .select("id");
    const after = await readProfile(a.client, a.userId);
    const refused = Boolean(error) || data?.length === 0;
    record(
      "2. A sets own site_id to B's site",
      refused && after.site_id === siteA,
      `${describe(error)} | site_id unchanged: ${after.site_id === siteA}`
    );
  }

  // 3. Own full_name: allowed, then restored.
  {
    const newName = `${RUN_ID}-name`;
    const { data, error } = await a.client
      .from("profiles")
      .update({ full_name: newName })
      .eq("id", a.userId)
      .select("id");
    const after = await readProfile(a.client, a.userId);
    const restore = await a.client
      .from("profiles")
      .update({ full_name: profileA.full_name })
      .eq("id", a.userId);
    record(
      "3. A changes own full_name (must succeed)",
      !error && data?.length === 1 && after.full_name === newName && !restore.error,
      `${describe(error)} | rows: ${data?.length ?? 0} | restored: ${!restore.error}`
    );
  }

  // 4. Read B's readings: 0 rows, although B's seed exists.
  {
    const { data, error } = await a.client.from("readings").select("id").eq("site_id", siteB);
    record(
      "4. A reads readings of B's site (B's seed exists)",
      !error && data.length === 0,
      `${describe(error)} | rows visible: ${data?.length ?? "n/a"}`
    );
  }

  // 5. Insert on B's site. No .select(): RETURNING would add a SELECT check
  // and could hide whether the INSERT itself was refused.
  {
    const { error } = await a.client
      .from("readings")
      .insert({ site_id: siteB, energy_type: "gas", value: 1, date: ATTACK_DATE });
    if (!error) {
      cleanups.push({
        label: "delete reading inserted by test 5",
        run: async () => {
          await b.client
            .from("readings")
            .delete()
            .match({ site_id: siteB, energy_type: "gas", date: ATTACK_DATE, created_by: a.userId });
        },
      });
    }
    const check = await b.client
      .from("readings")
      .select("id")
      .match({ site_id: siteB, energy_type: "gas", date: ATTACK_DATE, created_by: a.userId });
    record(
      "5. A inserts a reading on B's site",
      error?.code === "42501" && check.data?.length === 0,
      `${describe(error)} | rows found by B: ${check.data?.length ?? "n/a"}`
    );
  }

  // 6. Insert on own site impersonating B (created_by = B).
  {
    const { error } = await a.client
      .from("readings")
      .insert({ site_id: siteA, energy_type: "gas", value: 1, date: ATTACK_DATE, created_by: b.userId });
    if (!error) {
      cleanups.push({
        label: "delete reading inserted by test 6",
        run: async () => {
          await a.client
            .from("readings")
            .delete()
            .match({ site_id: siteA, energy_type: "gas", date: ATTACK_DATE, created_by: b.userId });
        },
      });
    }
    const check = await a.client
      .from("readings")
      .select("id")
      .match({ site_id: siteA, energy_type: "gas", date: ATTACK_DATE, created_by: b.userId });
    record(
      "6. A inserts on own site with created_by = B",
      error?.code === "42501" && check.data?.length === 0,
      `${describe(error)} | rows found: ${check.data?.length ?? "n/a"}`
    );
  }

  // 7. Duplicate of A's seed (same site, type, date).
  {
    const { error } = await a.client
      .from("readings")
      .insert({ site_id: siteA, energy_type: "water", value: 2, date: SEED_DATE });
    const check = await a.client
      .from("readings")
      .select("id")
      .match({ site_id: siteA, energy_type: "water", date: SEED_DATE });
    if (!error) manualCleanup.push(`readings: duplicate water ${SEED_DATE} on site A (constraint missing?)`);
    record(
      "7. A inserts a duplicate (site, type, date)",
      error?.code === "23505" && check.data?.length === 1,
      `${describe(error)} | rows for that key: ${check.data?.length ?? "n/a"}`
    );
  }

  // 8. Delete own site: no DELETE policy -> 0 rows, site still there.
  {
    const { data, error } = await a.client.from("sites").delete().eq("id", siteA).select("id");
    const check = await a.client.from("sites").select("id").eq("id", siteA);
    if (!error && data?.length) manualCleanup.push(`sites ${siteA} was DELETED: restore it`);
    record(
      "8. A deletes own site",
      (Boolean(error) || data?.length === 0) && check.data?.length === 1,
      `${describe(error)} | rows deleted: ${data?.length ?? 0} | site still exists: ${check.data?.length === 1}`
    );
  }

  // 9. Update B's full_name: RLS hides the row -> 0 rows, B's name unchanged.
  {
    const { data, error } = await a.client
      .from("profiles")
      .update({ full_name: `${RUN_ID}-hacked` })
      .eq("id", b.userId)
      .select("id");
    const after = await readProfile(b.client, b.userId);
    record(
      "9. A updates B's full_name",
      (Boolean(error) || data?.length === 0) && after.full_name === profileB.full_name,
      `${describe(error)} | rows updated: ${data?.length ?? 0} | B's name unchanged: ${after.full_name === profileB.full_name}`
    );
  }

  // 10. Insert a site. A refused INSERT always raises 42501 (WITH CHECK);
  // no Direction account here to read it back, so the error is the proof.
  {
    const { error } = await a.client.from("sites").insert({ name: RUN_ID, location: RUN_ID });
    if (!error) manualCleanup.push(`sites named "${RUN_ID}": archive it (no DELETE policy)`);
    record("10. A inserts a site", error?.code === "42501", describe(error));
  }

  // 11. Insert an AI summary on B's site.
  {
    const { error } = await a.client
      .from("ai_summaries")
      .insert({ site_id: siteB, summary_text: RUN_ID });
    if (!error) manualCleanup.push(`ai_summaries with summary_text "${RUN_ID}": delete as Direction`);
    const check = await b.client.from("ai_summaries").select("id").eq("summary_text", RUN_ID);
    record(
      "11. A inserts an AI summary on B's site",
      error?.code === "42501" && check.data?.length === 0,
      `${describe(error)} | rows found by B: ${check.data?.length ?? "n/a"}`
    );
  }

  // 12. Update B's seed reading: RLS hides it -> 0 rows, value unchanged (read by B).
  // If it went through, the "delete B seed reading" cleanup still removes the row by id.
  {
    const { data, error } = await a.client
      .from("readings")
      .update({ value: 999 })
      .eq("id", seedB.data.id)
      .select("id");
    const check = await b.client.from("readings").select("value").eq("id", seedB.data.id);
    const valueAfter = check.data?.[0]?.value;
    record(
      "12. A updates a reading of B",
      (Boolean(error) || data?.length === 0) && check.data?.length === 1 && Number(valueAfter) === 1,
      `${describe(error)} | rows updated: ${data?.length ?? 0} | value seen by B: ${valueAfter ?? "n/a"}`
    );
  }

  // 13. Delete B's seed reading: RLS hides it -> 0 rows, B still sees it.
  // Targets the seed's id only; the cleanup delete is a no-op if this test failed.
  {
    const { data, error } = await a.client
      .from("readings")
      .delete()
      .eq("id", seedB.data.id)
      .select("id");
    const check = await b.client.from("readings").select("id").eq("id", seedB.data.id);
    record(
      "13. A deletes a reading of B",
      (Boolean(error) || data?.length === 0) && check.data?.length === 1,
      `${describe(error)} | rows deleted: ${data?.length ?? 0} | still exists for B: ${check.data?.length === 1}`
    );
  }

  // Tests 14-17 edit A's own reading (ownA): fuel, value 1, site A, created_by A.
  type ReadingRow = { value: number; energy_type: string; site_id: string; created_by: string };
  const readOwnA = async (): Promise<ReadingRow | null> => {
    const { data } = await a.client
      .from("readings")
      .select("value, energy_type, site_id, created_by")
      .eq("id", ownA.data.id)
      .maybeSingle();
    return (data as ReadingRow | null) ?? null;
  };

  // 14. Control: A changes the value of its own reading (must succeed), then restores it.
  {
    const { data, error } = await a.client
      .from("readings")
      .update({ value: 2 })
      .eq("id", ownA.data.id)
      .select("id");
    const after = await readOwnA();
    const restore = await a.client.from("readings").update({ value: 1 }).eq("id", ownA.data.id).select("id");
    const restored = await readOwnA();
    record(
      "14. A updates the value of its own reading (must succeed)",
      !error && data?.length === 1 && Number(after?.value) === 2 && restore.data?.length === 1 && Number(restored?.value) === 1,
      `${describe(error)} | rows: ${data?.length ?? 0} | value after: ${after?.value ?? "n/a"} | restored to: ${restored?.value ?? "n/a"}`
    );
  }

  // 15-17: an immutable column. P0001 is required, not just "an error": before 003,
  // the old WITH CHECK would also refuse 16 and 17 (42501), which would hide a missing trigger.
  const immutable: { name: string; patch: Record<string, string>; unchanged: (r: ReadingRow) => boolean }[] = [
    {
      name: "15. A changes energy_type of its own reading",
      patch: { energy_type: "gas" },
      unchanged: (r) => r.energy_type === "fuel",
    },
    {
      name: "16. A moves its own reading to B's site",
      patch: { site_id: siteB },
      unchanged: (r) => r.site_id === siteA,
    },
    {
      name: "17. A sets created_by of its own reading to B",
      patch: { created_by: b.userId },
      unchanged: (r) => r.created_by === a.userId,
    },
  ];
  for (const t of immutable) {
    const { data, error } = await a.client
      .from("readings")
      .update(t.patch)
      .eq("id", ownA.data.id)
      .select("id");
    // Re-read as A; after a failed test 16 the row is on B's site, so ask B too.
    const after = (await readOwnA()) ?? ((await b.client
      .from("readings")
      .select("value, energy_type, site_id, created_by")
      .eq("id", ownA.data.id)
      .maybeSingle()).data as ReadingRow | null);
    record(
      t.name,
      error?.code === "P0001" && after !== null && t.unchanged(after),
      `${describe(error)} | rows: ${data?.length ?? 0} | unchanged: ${after ? t.unchanged(after) : "row not found"}`
    );
  }
}

async function run() {
  let crashed = false;
  try {
    await main();
  } catch (error) {
    crashed = true;
    console.error(`\nABORTED: ${(error as Error).message}`);
  } finally {
    // Reverse order: undo the most recent changes first.
    for (const c of cleanups.reverse()) {
      try {
        await c.run();
      } catch (error) {
        manualCleanup.push(`${c.label}: ${(error as Error).message}`);
      }
    }
    // Revoke the test sessions.
    await Promise.all(signedIn.map((client) => client.auth.signOut().catch(() => undefined)));
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} PASS${failed ? `, ${failed} FAIL` : ""}`);
  if (manualCleanup.length) {
    console.log("\nMANUAL CLEANUP NEEDED:");
    manualCleanup.forEach((m) => console.log(`  - ${m}`));
  }
  process.exitCode = crashed || failed || results.length !== 17 ? 1 : 0;
}

run();
