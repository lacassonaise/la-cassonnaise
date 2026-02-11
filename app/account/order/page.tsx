"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { eur } from "@/lib/format";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_cents: number;
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  /* Charger commandes */
  useEffect(() => {
    supabase
      .from("orders")
      .select("id, created_at, status, total_cents")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Order[] | null }) => {
        if (data) setOrders(data);
      });
  }, []);

  /* Temps réel */
  useEffect(() => {
    const channel = supabase
      .channel("my-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: any) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? payload.new : o
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Mes commandes</h1>

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border bg-white p-4"
          >
            <div className="flex justify-between">
              <div className="font-semibold">
                Commande #{o.id.slice(0, 6)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(o.created_at).toLocaleString("fr-FR")}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="text-sm font-bold text-gray-700">Détails de la commande :</div>
              {(o as any).order_items?.map((it: any, i: number) => {
                const c = it.customizations_json as any;
                return (
                  <div key={i} className="text-xs bg-gray-50 p-2 rounded-lg">
                    <div className="flex justify-between font-bold text-gray-900 mb-1">
                      <span>{it.quantity}× {it.name_snapshot}</span>
                      <span>{eur(it.price_cents * it.quantity)}</span>
                    </div>
                    {c && (
                      <div className="text-gray-600 pl-2 space-y-0.5 border-l-2 border-gray-200 ml-1">
                        {c.size && <div>Taille: <span className="font-medium uppercase">{c.size}</span></div>}
                        {c.meats?.length > 0 && <div>Viandes: {c.meats.join(", ")}</div>}
                        {c.sauces?.length > 0 && <div>Sauces: {c.sauces.join(", ")}</div>}
                        {c.sauce && <div>Sauce: {c.sauce}</div>}
                        {(c.extras?.length > 0 || c.addedIngredients?.length > 0 || c.extraIngredients?.length > 0) && (
                          <div className="text-green-700">Extra: {[...(c.extras || []), ...(c.addedIngredients || []), ...(c.extraIngredients?.map((e: any) => e.name) || [])].join(", ")}</div>
                        )}
                        {(c.removedIngredients?.length > 0 || c.removedSides?.length > 0 || c.removedVeggies?.length > 0) && (
                          <div className="text-red-600">Sans: {[...(c.removedIngredients || []), ...(c.removedSides || []), ...(c.removedVeggies || [])].join(", ")}</div>
                        )}
                        {c.cheesy && <div className="text-amber-800 font-bold">Option: Cheesy Crust</div>}
                        {c.pain && <div className="text-amber-800 font-bold">Option: Pain à la demande</div>}
                        {c.extraSalad && <div className="text-amber-800 font-bold">Option: Salade supp.</div>}
                        {c.menu && <div className="font-bold text-[#1F5C3A]">Formule Menu 🍟🥤</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t flex justify-between items-center bg-gray-50 -mx-4 px-4 py-2 mt-4">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total payé</span>
              <span className="text-xl font-black text-[#1F5C3A] tracking-tight">{eur(o.total_cents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
