"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkinPreviewCard } from "@/components/avatar/skin-preview-card";
import { ComingSoonCard } from "@/components/shop/coming-soon-card";
import { SKIN_CATALOG, ITEM_CATALOG, RARITY_CONFIG } from "@/lib/lootbox/items";
import { getRank } from "@/lib/rank/system";
import { createClient } from "@/lib/supabase/client";
import { formatSC } from "@/lib/sc/engine";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Sparkles, Package, Gift } from "lucide-react";

export default function ShopPage() {
  const [balance, setBalance] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);
  const [activeSkin, setActiveSkin] = useState<string | null>(null);
  const [totalKm, setTotalKm] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, skinsRes] = await Promise.all([
        supabase.from("profiles").select("sc_balance, total_distance_km, active_skin_id").eq("id", user.id).single(),
        supabase.from("user_skins").select("skin_id, skins(slug)").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setBalance(profileRes.data.sc_balance || 0);
        setTotalKm(profileRes.data.total_distance_km || 0);
        setActiveSkin(profileRes.data.active_skin_id);
      }
      if (skinsRes.data) {
        const slugs = skinsRes.data
          .map((s: Record<string, unknown>) => {
            const skin = s.skins as { slug: string } | null;
            return skin?.slug;
          })
          .filter(Boolean) as string[];
        setOwnedSkins(slugs);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const rank = getRank(totalKm);

  async function handleBuySkin(slug: string, price: number) {
    if (balance < price) {
      alert("$SC not enough!");
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get skin ID from DB
    const { data: skinData } = await supabase.from("skins").select("id").eq("slug", slug).single();
    if (!skinData) return;

    // Deduct SC
    const newBalance = balance - price;
    await supabase.from("profiles").update({ sc_balance: newBalance }).eq("id", user.id);

    // Record transaction
    await supabase.from("sc_transactions").insert({
      user_id: user.id,
      amount: -price,
      type: "shop_purchase",
      description: `Purchased skin: ${slug}`,
      balance_after: newBalance,
    });

    // Grant skin
    await supabase.from("user_skins").insert({
      user_id: user.id,
      skin_id: skinData.id,
      source: "purchase",
    });

    setBalance(newBalance);
    setOwnedSkins((prev) => [...prev, slug]);
  }

  async function handleEquipSkin(slug: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: skinData } = await supabase.from("skins").select("id").eq("slug", slug).single();
    if (!skinData) return;

    await supabase.from("profiles").update({ active_skin_id: skinData.id }).eq("id", user.id);
    setActiveSkin(skinData.id);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl bg-neutral-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-neutral-800" />
      </div>
    );
  }

  const purchasableSkins = SKIN_CATALOG.filter((s) => s.isPurchasable);
  const purchasableItems = ITEM_CATALOG;

  return (
    <div className="space-y-4 pb-20">
      {/* Balance header */}
      <Card className="border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-800">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="size-5 text-yellow-400" />
            <div>
              <p className="text-xs text-neutral-400">SC Shop</p>
              <p className="text-lg font-black text-neutral-100">SC Store</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Balance</p>
            <p className="text-lg font-black text-green-400">{formatSC(balance)}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="skins" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-neutral-800">
          <TabsTrigger value="skins" className="text-xs data-[state=active]:bg-neutral-700">
            <Sparkles className="mr-1 size-3" />
            Skins
          </TabsTrigger>
          <TabsTrigger value="items" className="text-xs data-[state=active]:bg-neutral-700">
            <Package className="mr-1 size-3" />
            Items
          </TabsTrigger>
          <TabsTrigger value="merch" className="text-xs data-[state=active]:bg-neutral-700">
            <Gift className="mr-1 size-3" />
            Merch
          </TabsTrigger>
        </TabsList>

        {/* SKINS TAB */}
        <TabsContent value="skins" className="space-y-3 mt-3">
          <p className="text-xs text-neutral-500">
            Purchase skins to customize your runner avatar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {purchasableSkins.map((skin) => (
              <SkinPreviewCard
                key={skin.slug}
                name={skin.name}
                nameCn={skin.nameCn}
                description={skin.description}
                rarity={skin.rarity}
                priceSc={skin.priceSc}
                isPurchasable={skin.isPurchasable}
                isOwned={ownedSkins.includes(skin.slug)}
                isEquipped={false}
                slug={skin.slug}
                onBuy={() => handleBuySkin(skin.slug, skin.priceSc)}
                onEquip={() => handleEquipSkin(skin.slug)}
              />
            ))}
          </div>

          {/* Mythic skin teaser */}
          <Card className="border-red-900/50 bg-red-950/20">
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <Badge variant="outline" className="border-red-700 text-red-400 text-[10px]">
                MYTHIC
              </Badge>
              <p className="text-sm font-bold text-red-300">Marathon God</p>
              <p className="text-[11px] text-neutral-500 text-center">
                Run 1,000 km to unlock. Cannot be purchased.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-3 mt-3">
          <p className="text-xs text-neutral-500">
            Consumable items to boost your game.
          </p>
          <div className="space-y-2">
            {purchasableItems.map((item) => {
              const rarityConf = RARITY_CONFIG[item.rarity];
              return (
                <div
                  key={item.slug}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${rarityConf.bgColor} ${rarityConf.borderColor}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-200">{item.nameCn}</p>
                      <span className={`text-[10px] font-bold uppercase ${rarityConf.color}`}>
                        {rarityConf.labelCn}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">{item.description}</p>
                  </div>
                  <button
                    className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-500 transition-colors"
                    onClick={() => alert("Item purchase coming soon!")}
                  >
                    {item.priceSc} $SC
                  </button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* MERCH TAB */}
        <TabsContent value="merch" className="space-y-3 mt-3">
          <p className="text-xs text-neutral-500">
            Use $SC to get discounts on real running gear.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ComingSoonCard
              name="Running Socks"
              description="Premium compression socks. Redeem with $SC for discount."
              emoji="🧦"
            />
            <ComingSoonCard
              name="Energy Gels"
              description="Race-day fuel pack. $SC discount available."
              emoji="⚡"
            />
            <ComingSoonCard
              name="Sweat Casino Tee"
              description="Official team tee. Rep your squad."
              emoji="👕"
            />
            <ComingSoonCard
              name="Headband"
              description="Moisture-wicking headband with logo."
              emoji="🎽"
            />
            <ComingSoonCard
              name="Water Bottle"
              description="Insulated bottle with $SC engraving."
              emoji="🍶"
            />
            <ComingSoonCard
              name="Race Entry"
              description="Sponsored race entry fee discount."
              emoji="🏁"
            />
          </div>
          <Card className="border-yellow-900/50 bg-yellow-950/20">
            <CardContent className="py-4 text-center">
              <p className="text-sm font-semibold text-yellow-400">
                Merch Store Opening Soon!
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                We are partnering with running brands. Stay tuned for exclusive $SC discounts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
