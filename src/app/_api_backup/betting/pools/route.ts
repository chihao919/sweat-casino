import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PoolStatus, PoolSide, PoolType, TransactionType } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatePoolBody {
  title: string;
  description?: string;
  poolType: PoolType;
  sideALabel: string;
  sideBLabel: string;
  lockAt: string;
  resolveAt: string;
}

interface JoinPoolBody {
  poolId: string;
  side: PoolSide;
  amount: number;
}

// ---------------------------------------------------------------------------
// GET — List betting pools
// ---------------------------------------------------------------------------

/**
 * Returns a list of betting pools.
 *
 * Query params:
 *  - status: "open" | "all"  (defaults to "open")
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "open";

    const adminClient = createAdminClient();
    let query = adminClient
      .from("betting_pools")
      .select(
        `
        *,
        pool_entries(count)
      `
      )
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", PoolStatus.OPEN);
    }

    const { data: pools, error } = await query;

    if (error) {
      console.error("[betting/pools GET] DB error:", error);
      return NextResponse.json(
        { error: "Failed to fetch pools" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pools });
  } catch (err) {
    console.error("[betting/pools GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a new betting pool
// ---------------------------------------------------------------------------

/**
 * Creates a new betting pool for the active season.
 *
 * Body: { title, description?, poolType, sideALabel, sideBLabel, lockAt, resolveAt }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSessionClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePoolBody;

    if (!body.title || !body.poolType || !body.sideALabel || !body.sideBLabel || !body.lockAt || !body.resolveAt) {
      return NextResponse.json(
        { error: "title, poolType, sideALabel, sideBLabel, lockAt, and resolveAt are required" },
        { status: 400 }
      );
    }

    if (!Object.values(PoolType).includes(body.poolType)) {
      return NextResponse.json(
        { error: `Invalid poolType. Must be one of: ${Object.values(PoolType).join(", ")}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: season } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    const { data: pool, error: poolError } = await adminClient
      .from("betting_pools")
      .insert({
        season_id: season.id,
        pool_type: body.poolType,
        title: body.title,
        description: body.description ?? null,
        status: PoolStatus.OPEN,
        total_pool: 0,
        side_a_total: 0,
        side_b_total: 0,
        side_a_label: body.sideALabel,
        side_b_label: body.sideBLabel,
        winning_side: null,
        lock_at: new Date(body.lockAt).toISOString(),
        resolve_at: new Date(body.resolveAt).toISOString(),
      })
      .select("*")
      .single();

    if (poolError || !pool) {
      console.error("[betting/pools POST] Insert failed:", poolError);
      return NextResponse.json(
        { error: "Failed to create pool" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pool }, { status: 201 });
  } catch (err) {
    console.error("[betting/pools POST] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Join an existing betting pool
// ---------------------------------------------------------------------------

/**
 * Adds the authenticated user as an entrant in a betting pool.
 *
 * Body: { poolId, side: 'a'|'b', amount }
 *
 * Validates that:
 *  - The pool is still open.
 *  - The user hasn't already entered this pool.
 *  - The user has sufficient $SC balance.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSessionClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as JoinPoolBody;

    if (!body.poolId || !body.side || body.amount == null) {
      return NextResponse.json(
        { error: "poolId, side, and amount are required" },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!Object.values(PoolSide).includes(body.side)) {
      return NextResponse.json(
        { error: `Invalid side. Must be one of: ${Object.values(PoolSide).join(", ")}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // Verify the pool exists and is still accepting entries
    // ------------------------------------------------------------------
    const { data: pool, error: poolError } = await adminClient
      .from("betting_pools")
      .select("*")
      .eq("id", body.poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    if (pool.status !== PoolStatus.OPEN) {
      return NextResponse.json(
        { error: "Pool is no longer accepting entries" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Prevent duplicate entries from the same user
    // ------------------------------------------------------------------
    const { data: existingEntry } = await adminClient
      .from("pool_entries")
      .select("id")
      .eq("pool_id", body.poolId)
      .eq("user_id", user.id)
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: "You have already entered this pool" },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------
    // Verify the user has enough $SC to cover the entry
    // ------------------------------------------------------------------
    const { data: profile } = await adminClient
      .from("profiles")
      .select("sc_balance")
      .eq("id", user.id)
      .single();

    if (!profile || profile.sc_balance < body.amount) {
      return NextResponse.json(
        { error: "Insufficient $SC balance" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Deduct the entry fee via process_sc_transaction RPC
    // ------------------------------------------------------------------
    const { data: season } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    const { error: txError } = await adminClient.rpc(
      "process_sc_transaction",
      {
        p_user_id: user.id,
        p_amount: -body.amount,
        p_type: TransactionType.POOL_ENTRY,
        p_description: `Pool entry: ${body.amount} $SC on side ${body.side} of pool "${pool.title}"`,
        p_reference_id: body.poolId,
      }
    );

    if (txError) {
      console.error("[betting/pools PUT] Stake deduction failed:", txError);
      return NextResponse.json(
        { error: "Failed to deduct entry fee" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // Insert the pool entry
    // ------------------------------------------------------------------
    const { data: entry, error: entryError } = await adminClient
      .from("pool_entries")
      .insert({
        pool_id: body.poolId,
        user_id: user.id,
        side: body.side,
        amount: body.amount,
        payout: null,
      })
      .select("*")
      .single();

    if (entryError || !entry) {
      console.error("[betting/pools PUT] Entry insert failed:", entryError);
      return NextResponse.json(
        { error: "Failed to create pool entry" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // Update pool totals atomically
    // ------------------------------------------------------------------
    const sideColumn = body.side === PoolSide.A ? "side_a_total" : "side_b_total";

    await adminClient
      .from("betting_pools")
      .update({
        total_pool: pool.total_pool + body.amount,
        [sideColumn]: (pool[sideColumn] ?? 0) + body.amount,
      })
      .eq("id", body.poolId);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("[betting/pools PUT] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
