import { describe, it, expect } from "vitest";
import { rollLootDrop } from "@/lib/lootbox/drops";
import { SKIN_CATALOG, ITEM_CATALOG, RARITY_CONFIG, getSkinBySlug, getItemBySlug } from "@/lib/lootbox/items";

describe("Loot Box System", () => {
  describe("rollLootDrop", () => {
    it("always returns a valid drop", () => {
      for (let i = 0; i < 100; i++) {
        const drop = rollLootDrop(5);
        expect(["sc", "item", "skin"]).toContain(drop.type);
        expect(["common", "rare", "epic", "legendary", "mythic"]).toContain(drop.rarity);
      }
    });

    it("SC drops have a positive amount", () => {
      // Roll many times to get SC drops
      for (let i = 0; i < 200; i++) {
        const drop = rollLootDrop(5);
        if (drop.type === "sc") {
          expect(drop.scAmount).toBeGreaterThan(0);
          expect(drop.scAmount).toBeLessThanOrEqual(30);
          return; // test passes once we find one
        }
      }
    });

    it("item drops reference valid item slugs", () => {
      const validSlugs = ITEM_CATALOG.map((i) => i.slug);
      for (let i = 0; i < 500; i++) {
        const drop = rollLootDrop(10);
        if (drop.type === "item" && drop.itemSlug) {
          expect(validSlugs).toContain(drop.itemSlug);
        }
      }
    });

    it("skin drops reference valid skin slugs", () => {
      const validSlugs = SKIN_CATALOG.map((s) => s.slug);
      for (let i = 0; i < 500; i++) {
        const drop = rollLootDrop(10);
        if (drop.type === "skin" && drop.skinSlug) {
          expect(validSlugs).toContain(drop.skinSlug);
        }
      }
    });

    it("longer runs can produce drops", () => {
      // Just verify no errors for various distances
      expect(() => rollLootDrop(0.5)).not.toThrow();
      expect(() => rollLootDrop(5)).not.toThrow();
      expect(() => rollLootDrop(20)).not.toThrow();
      expect(() => rollLootDrop(42.195)).not.toThrow();
    });

    it("lucky charm parameter accepted", () => {
      expect(() => rollLootDrop(10, true)).not.toThrow();
    });
  });

  describe("Item Catalog", () => {
    it("has items defined", () => {
      expect(ITEM_CATALOG.length).toBeGreaterThan(0);
    });

    it("all items have required fields", () => {
      for (const item of ITEM_CATALOG) {
        expect(item.slug).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.nameCn).toBeTruthy();
        expect(item.priceSc).toBeGreaterThanOrEqual(0);
        expect(["common", "rare", "epic", "legendary"]).toContain(item.rarity);
      }
    });

    it("getItemBySlug returns correct item", () => {
      const item = getItemBySlug("tax-shield");
      expect(item).toBeDefined();
      expect(item!.name).toBe("Tax Shield");
    });

    it("getItemBySlug returns undefined for unknown slug", () => {
      expect(getItemBySlug("nonexistent")).toBeUndefined();
    });
  });

  describe("Skin Catalog", () => {
    it("has skins defined", () => {
      expect(SKIN_CATALOG.length).toBeGreaterThan(0);
    });

    it("has exactly one mythic skin", () => {
      const mythics = SKIN_CATALOG.filter((s) => s.rarity === "mythic");
      expect(mythics).toHaveLength(1);
      expect(mythics[0].slug).toBe("marathon-god");
    });

    it("mythic skin is not purchasable", () => {
      const god = getSkinBySlug("marathon-god");
      expect(god!.isPurchasable).toBe(false);
    });

    it("all purchasable skins have price > 0", () => {
      for (const skin of SKIN_CATALOG) {
        if (skin.isPurchasable) {
          expect(skin.priceSc).toBeGreaterThan(0);
        }
      }
    });

    it("all skins have color definitions", () => {
      for (const skin of SKIN_CATALOG) {
        expect(skin.colors.primary).toBeTruthy();
      }
    });
  });

  describe("Rarity Config", () => {
    it("all 5 rarities are configured", () => {
      expect(Object.keys(RARITY_CONFIG)).toHaveLength(5);
      expect(RARITY_CONFIG.common).toBeDefined();
      expect(RARITY_CONFIG.rare).toBeDefined();
      expect(RARITY_CONFIG.epic).toBeDefined();
      expect(RARITY_CONFIG.legendary).toBeDefined();
      expect(RARITY_CONFIG.mythic).toBeDefined();
    });
  });
});
