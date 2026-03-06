/**
 * BDD Tests for New User Signup (handle_new_user trigger)
 *
 * DB Trigger Flow (007_fix_new_user_trigger.sql):
 *   1. User completes Google OAuth → Supabase creates auth.users row
 *   2. on_auth_user_created trigger fires handle_new_user()
 *   3. INSERT INTO profiles (id, email, display_name, avatar_url)
 *      - display_name: COALESCE(display_name, full_name, name, email prefix)
 *      - avatar_url: from Google OAuth metadata
 *      - ON CONFLICT: update email + avatar (handles re-signups)
 *   4. INSERT INTO sc_transactions (signup_bonus, 100 $SC)
 *      - WHERE NOT EXISTS: prevents duplicate bonuses
 *
 * Known failure points:
 *   A. search_path not set → function can't find public.profiles
 *   B. Missing NOT NULL fields in profiles
 *   C. sc_transactions CHECK constraint on type
 *   D. Duplicate signup (auth.users row exists, trigger re-fires)
 *   E. Google metadata fields missing or using different keys
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Helpers — replicate trigger logic in TypeScript for testability
// ---------------------------------------------------------------------------

interface AuthUserMetadata {
  display_name?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  email?: string;
}

interface NewAuthUser {
  id: string;
  email: string;
  raw_user_meta_data: AuthUserMetadata;
}

/** Replicates the COALESCE logic from handle_new_user for display_name */
function resolveDisplayName(user: NewAuthUser): string {
  return (
    user.raw_user_meta_data.display_name ||
    user.raw_user_meta_data.full_name ||
    user.raw_user_meta_data.name ||
    user.email.split("@")[0]
  );
}

/** Replicates avatar extraction from Google OAuth metadata */
function resolveAvatarUrl(user: NewAuthUser): string | null {
  return user.raw_user_meta_data.avatar_url ?? null;
}

/** Build the profile insert payload (mirrors what the trigger does) */
function buildProfilePayload(user: NewAuthUser) {
  return {
    id: user.id,
    email: user.email,
    display_name: resolveDisplayName(user),
    avatar_url: resolveAvatarUrl(user),
  };
}

/** Build the signup bonus transaction payload */
function buildSignupBonusPayload(userId: string) {
  return {
    user_id: userId,
    amount: 100.0,
    type: "signup_bonus" as const,
    description: "Welcome to Sweat Casino! Here's 100 $SC to get started.",
    balance_after: 100.0,
  };
}

/** Check if signup bonus should be granted (no prior bonus exists) */
function shouldGrantSignupBonus(
  existingTransactions: { user_id: string; type: string }[],
  userId: string
): boolean {
  return !existingTransactions.some(
    (t) => t.user_id === userId && t.type === "signup_bonus"
  );
}

/** Simulates ON CONFLICT behavior for profiles */
function upsertProfile(
  existingProfiles: Map<string, ReturnType<typeof buildProfilePayload>>,
  newProfile: ReturnType<typeof buildProfilePayload>
): ReturnType<typeof buildProfilePayload> {
  const existing = existingProfiles.get(newProfile.id);
  if (existing) {
    // ON CONFLICT: update email, avatar (keep old avatar if new is null)
    return {
      ...existing,
      email: newProfile.email,
      avatar_url: newProfile.avatar_url ?? existing.avatar_url,
    };
  }
  return newProfile;
}

// ---------------------------------------------------------------------------
// Valid transaction types (from CHECK constraint in 003_betting_system.sql)
// ---------------------------------------------------------------------------

const VALID_TRANSACTION_TYPES = [
  "activity_reward",
  "weather_bonus",
  "bet_stake",
  "bet_payout",
  "bet_refund",
  "pool_entry",
  "pool_payout",
  "pool_refund",
  "survival_tax",
  "season_bonus",
  "signup_bonus",
  "manual_adjustment",
];

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeGoogleUser(overrides: Partial<NewAuthUser> = {}): NewAuthUser {
  return {
    id: "user-uuid-123",
    email: "testuser@gmail.com",
    raw_user_meta_data: {
      display_name: undefined,
      full_name: "Test User",
      name: "Test",
      avatar_url: "https://lh3.googleusercontent.com/photo.jpg",
      ...overrides.raw_user_meta_data,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Feature: New User Signup
// ---------------------------------------------------------------------------

describe("Feature: New User Signup (handle_new_user trigger)", () => {
  // =========================================================================
  // Scenario: Display name resolution from Google metadata
  // =========================================================================
  describe("Scenario: Resolve display name from OAuth metadata", () => {
    it("Given Google provides display_name, Then use display_name", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {
          display_name: "Steven H",
          full_name: "Steven Huang",
          name: "Steven",
        },
      });
      expect(resolveDisplayName(user)).toBe("Steven H");
    });

    it("Given no display_name but full_name exists, Then use full_name", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {
          full_name: "Steven Huang",
          name: "Steven",
        },
      });
      expect(resolveDisplayName(user)).toBe("Steven Huang");
    });

    it("Given only name exists, Then use name", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {
          name: "Steven",
        },
      });
      expect(resolveDisplayName(user)).toBe("Steven");
    });

    it("Given no name fields at all, Then fallback to email prefix", () => {
      const user = makeGoogleUser({
        email: "coolrunner@gmail.com",
        raw_user_meta_data: {},
      });
      expect(resolveDisplayName(user)).toBe("coolrunner");
    });

    it("Given empty string display_name, Then fallback to next field", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {
          display_name: "",
          full_name: "Real Name",
        },
      });
      expect(resolveDisplayName(user)).toBe("Real Name");
    });
  });

  // =========================================================================
  // Scenario: Avatar URL extraction
  // =========================================================================
  describe("Scenario: Extract avatar URL from Google metadata", () => {
    it("Given Google provides avatar_url, Then use it", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {
          avatar_url: "https://lh3.googleusercontent.com/photo.jpg",
        },
      });
      expect(resolveAvatarUrl(user)).toBe(
        "https://lh3.googleusercontent.com/photo.jpg"
      );
    });

    it("Given no avatar_url in metadata, Then return null", () => {
      const user = makeGoogleUser({
        raw_user_meta_data: {},
      });
      expect(resolveAvatarUrl(user)).toBeNull();
    });
  });

  // =========================================================================
  // Scenario: Profile payload matches DB schema
  // =========================================================================
  describe("Scenario: Profile insert payload matches DB schema", () => {
    it("Given a Google user, Then payload has all required fields", () => {
      const user = makeGoogleUser();
      const payload = buildProfilePayload(user);

      expect(payload).toHaveProperty("id");
      expect(payload).toHaveProperty("email");
      expect(payload).toHaveProperty("display_name");
      expect(payload).toHaveProperty("avatar_url");

      // display_name must never be null/undefined (DB may have NOT NULL or we want a good UX)
      expect(typeof payload.display_name).toBe("string");
      expect(payload.display_name.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Scenario: Signup bonus transaction
  // =========================================================================
  describe("Scenario: Signup bonus is granted correctly", () => {
    it("Given a new user, Then signup bonus of 100 $SC is created", () => {
      const bonus = buildSignupBonusPayload("user-1");

      expect(bonus.amount).toBe(100.0);
      expect(bonus.type).toBe("signup_bonus");
      expect(bonus.balance_after).toBe(100.0);
    });

    it("'signup_bonus' is a valid transaction type per CHECK constraint", () => {
      expect(VALID_TRANSACTION_TYPES).toContain("signup_bonus");
    });

    it("Given no prior signup_bonus, Then bonus should be granted", () => {
      const existing = [
        { user_id: "user-2", type: "signup_bonus" },
        { user_id: "user-1", type: "activity_reward" },
      ];
      expect(shouldGrantSignupBonus(existing, "user-1")).toBe(true);
    });

    it("Given prior signup_bonus exists, Then bonus should NOT be granted (prevent duplicate)", () => {
      const existing = [
        { user_id: "user-1", type: "signup_bonus" },
      ];
      expect(shouldGrantSignupBonus(existing, "user-1")).toBe(false);
    });
  });

  // =========================================================================
  // Scenario: ON CONFLICT handling (duplicate signup)
  // =========================================================================
  describe("Scenario: Duplicate signup is handled gracefully", () => {
    it("Given profile already exists, Then update email and avatar instead of failing", () => {
      const existingProfiles = new Map([
        [
          "user-1",
          {
            id: "user-1",
            email: "old@gmail.com",
            display_name: "Old Name",
            avatar_url: "https://old-photo.jpg",
          },
        ],
      ]);

      const newProfile = buildProfilePayload(
        makeGoogleUser({
          id: "user-1",
          email: "new@gmail.com",
          raw_user_meta_data: {
            full_name: "New Name",
            avatar_url: "https://new-photo.jpg",
          },
        })
      );

      const result = upsertProfile(existingProfiles, newProfile);

      // Email and avatar updated
      expect(result.email).toBe("new@gmail.com");
      expect(result.avatar_url).toBe("https://new-photo.jpg");
      // display_name preserved from existing (ON CONFLICT doesn't update it)
      expect(result.display_name).toBe("Old Name");
    });

    it("Given duplicate signup with null avatar, Then keep existing avatar", () => {
      const existingProfiles = new Map([
        [
          "user-1",
          {
            id: "user-1",
            email: "test@gmail.com",
            display_name: "Test",
            avatar_url: "https://existing-photo.jpg",
          },
        ],
      ]);

      const newProfile = buildProfilePayload(
        makeGoogleUser({
          id: "user-1",
          raw_user_meta_data: { full_name: "Test" },
          // no avatar_url in metadata
        })
      );

      const result = upsertProfile(existingProfiles, newProfile);

      expect(result.avatar_url).toBe("https://existing-photo.jpg");
    });

    it("Given new user (no conflict), Then insert as-is", () => {
      const existingProfiles = new Map<string, ReturnType<typeof buildProfilePayload>>();

      const newProfile = buildProfilePayload(makeGoogleUser({ id: "brand-new-user" }));
      const result = upsertProfile(existingProfiles, newProfile);

      expect(result.id).toBe("brand-new-user");
    });
  });

  // =========================================================================
  // Scenario: End-to-end signup flow
  // =========================================================================
  describe("Scenario: Complete signup flow", () => {
    it("Given a new Google user signs up, Then profile + bonus are created", () => {
      const user = makeGoogleUser({
        id: "new-user-uuid",
        email: "runner@gmail.com",
        raw_user_meta_data: {
          full_name: "Happy Runner",
          avatar_url: "https://photo.jpg",
        },
      });

      // Step 1: Build profile
      const profile = buildProfilePayload(user);
      expect(profile.id).toBe("new-user-uuid");
      expect(profile.email).toBe("runner@gmail.com");
      expect(profile.display_name).toBe("Happy Runner");
      expect(profile.avatar_url).toBe("https://photo.jpg");

      // Step 2: Check if bonus should be granted
      const existingTx: { user_id: string; type: string }[] = [];
      expect(shouldGrantSignupBonus(existingTx, "new-user-uuid")).toBe(true);

      // Step 3: Build bonus
      const bonus = buildSignupBonusPayload("new-user-uuid");
      expect(bonus.amount).toBe(100);
      expect(bonus.type).toBe("signup_bonus");
    });

    it("Given user signs up again (re-trigger), Then profile updated, no duplicate bonus", () => {
      const user = makeGoogleUser({ id: "existing-user" });

      // Profile already exists
      const existingProfiles = new Map([
        ["existing-user", buildProfilePayload(makeGoogleUser({ id: "existing-user" }))],
      ]);

      // Upsert should not fail
      const profile = upsertProfile(existingProfiles, buildProfilePayload(user));
      expect(profile.id).toBe("existing-user");

      // Bonus already granted
      const existingTx = [{ user_id: "existing-user", type: "signup_bonus" }];
      expect(shouldGrantSignupBonus(existingTx, "existing-user")).toBe(false);
    });
  });
});
