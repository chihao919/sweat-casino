import { describe, it, expect } from "vitest";
import {
  getRank,
  getNextRank,
  getRankProgress,
  checkRankUp,
  RANKS,
} from "@/lib/rank/system";

describe("Rank System", () => {
  describe("getRank", () => {
    it("0 km = Bronze", () => {
      expect(getRank(0).id).toBe("bronze");
    });

    it("49.9 km = still Bronze", () => {
      expect(getRank(49.9).id).toBe("bronze");
    });

    it("50 km = Silver", () => {
      expect(getRank(50).id).toBe("silver");
    });

    it("150 km = Gold", () => {
      expect(getRank(150).id).toBe("gold");
    });

    it("400 km = Diamond", () => {
      expect(getRank(400).id).toBe("diamond");
    });

    it("1000 km = Master", () => {
      expect(getRank(1000).id).toBe("master");
    });

    it("9999 km = still Master (max)", () => {
      expect(getRank(9999).id).toBe("master");
    });
  });

  describe("getNextRank", () => {
    it("Bronze -> next is Silver", () => {
      expect(getNextRank(0)?.id).toBe("silver");
    });

    it("Master -> next is null (max rank)", () => {
      expect(getNextRank(1000)).toBeNull();
    });
  });

  describe("getRankProgress", () => {
    it("0 km = 0% toward Silver", () => {
      expect(getRankProgress(0)).toBe(0);
    });

    it("25 km = 50% toward Silver (50km)", () => {
      expect(getRankProgress(25)).toBe(50);
    });

    it("50 km = 0% toward Gold (just hit Silver)", () => {
      expect(getRankProgress(50)).toBe(0);
    });

    it("1000 km = 100% (max rank)", () => {
      expect(getRankProgress(1000)).toBe(100);
    });
  });

  describe("checkRankUp", () => {
    it("45 -> 55 km = ranked up to Silver", () => {
      const result = checkRankUp(45, 55);
      expect(result).not.toBeNull();
      expect(result!.id).toBe("silver");
    });

    it("10 -> 20 km = no rank up (still Bronze)", () => {
      expect(checkRankUp(10, 20)).toBeNull();
    });

    it("145 -> 155 km = ranked up to Gold", () => {
      expect(checkRankUp(145, 155)?.id).toBe("gold");
    });

    it("multi-rank skip: 40 -> 160 km = Gold (highest reached)", () => {
      expect(checkRankUp(40, 160)?.id).toBe("gold");
    });
  });

  describe("RANKS configuration", () => {
    it("has 5 ranks", () => {
      expect(RANKS).toHaveLength(5);
    });

    it("ranks are in ascending minKm order", () => {
      for (let i = 1; i < RANKS.length; i++) {
        expect(RANKS[i].minKm).toBeGreaterThan(RANKS[i - 1].minKm);
      }
    });

    it("each rank has a SC reward", () => {
      for (const rank of RANKS) {
        expect(typeof rank.scReward).toBe("number");
      }
    });
  });
});
