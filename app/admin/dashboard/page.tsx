"use client";

import "./print.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { eur } from "@/lib/format";
import { OrderTicket } from "@/components/OrderTicket";

/* =====================
   TYPES (DB-ALIGNED)
===================== */

type KitchenStatus = "pending" | "paid" | "preparing" | "ready";

type OrderItem = {
  name_snapshot: string;
  quantity: number;
  price_cents: number;
  customizations_json?: any;
};

type Order = {
  id: string;
  created_at: string;
  status: KitchenStatus;
  total_cents: number;
  phone?: string;
  note?: string;
  mode?: "pickup" | "delivery";
  delivery_address?: string;
  delivery_fee_cents?: number;
  delivery_free?: boolean;
  reward_used?: string;
  order_items: OrderItem[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "loyalty" | "messages">("orders");
  const [view, setView] = useState<"kitchen" | "history">("kitchen");
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* =====================
     ADMIN GUARD
  ===================== */

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profile?.role !== "admin") router.push("/");
    });
  }, [router]);

  /* =====================
     LOAD ORDERS
  ===================== */

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        status,
        total_cents,
        phone,
        note,
        mode,
        delivery_address,
        delivery_fee_cents,
        delivery_free,
        reward_used,
        order_items (
          name_snapshot,
          quantity,
          price_cents,
          customizations_json
        )
      `)
      .in("status", ["pending", "paid", "preparing", "ready"])
      .order("created_at", { ascending: false });

    if (data) setOrders(data as Order[]);
  }

  async function loadMessages() {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (data) setMessages(data);
  }

  async function loadLoyalty() {
    const { data } = await supabase.from("loyalty_points").select("*").order("points", { ascending: false });
    if (data) setLoyaltyAccounts(data);
  }

  useEffect(() => {
    loadOrders();
    loadMessages();
    loadLoyalty();
  }, []);

  /* =====================
     REALTIME
  ===================== */

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn("🔈 Audio play blocked or failed:", err.message);
      });
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          console.log("🔔 Changement DB détecté:", payload.eventType);

          // Attend un court instant pour s'assurer que les order_items sont insérés 
          // (Supabase insert les items juste après l'order)
          if (payload.eventType === "INSERT") {
            await new Promise(r => setTimeout(r, 1000));
          }

          const orderId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (!orderId) return;

          const { data, error } = await supabase
            .from("orders")
            .select(`
              id,
              created_at,
              status,
              total_cents,
              phone,
              note,
              mode,
              delivery_address,
              delivery_fee_cents,
              delivery_free,
              reward_used,
              order_items (
                name_snapshot,
                quantity,
                price_cents,
                customizations_json
              )
            `)
            .eq("id", orderId)
            .single();

          if (error || !data) {
            // Si l'ordre est supprimé ou introuvable après l'update
            if (payload.eventType === "DELETE") {
              setOrders(prev => prev.filter(o => o.id !== orderId));
            }
            return;
          }

          setOrders((prev) => {
            const exists = prev.some((o) => o.id === data.id);
            const newList = exists
              ? prev.map((o) => (o.id === data.id ? (data as Order) : o))
              : [data as Order, ...prev];

            // Ne garder que les commandes actives dans le state principal
            return newList.filter(o => ["pending", "paid", "preparing", "ready"].includes(o.status));
          });

          // Notification sonore et impression auto pour nouvelle commande payée
          if (payload.eventType === "INSERT" && (data.status === "paid" || data.status === "pending")) {
            playNotification();
            setPrintOrder(data as Order);
            setTimeout(() => window.print(), 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =====================
     STATUS UPDATE (CUISINE)
  ===================== */

  async function updateStatus(orderId: string, status: KitchenStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) alert("Erreur lors de la mise à jour du statut");
  }

  function handleManualPrint(order: Order) {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  }

  /* =====================
     FILTERS
  ===================== */

  const kitchenOrders = useMemo(
    () => orders.filter((o) => o.status !== "ready"),
    [orders]
  );

  const historyOrders = useMemo(
    () => orders.filter((o) => o.status === "ready"),
    [orders]
  );

  const displayed = view === "kitchen" ? kitchenOrders : historyOrders;

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div id="print-area">
        {printOrder && <OrderTicket order={printOrder} />}
      </div>

      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ADMINISTRATION</h1>
            <p className="text-gray-500 text-sm font-medium">Gestion globale du restaurant</p>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📋 COMMANDES
            </button>
            <button
              onClick={() => setActiveTab("loyalty")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'loyalty' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🎁 FIDÉLITÉ
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'messages' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ✉️ MESSAGES
            </button>
          </div>
        </div>

        {activeTab === "orders" && (
          <div className="mt-6 flex justify-center border-t pt-6">
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setView("kitchen")}
                className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${view === 'kitchen' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                EN COURS ({kitchenOrders.length})
              </button>
              <button
                onClick={() => setView("history")}
                className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${view === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                TERMINÉES ({historyOrders.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "orders" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {displayed.map((order) => (
            <div key={order.id} className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-100 p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Commande</span>
                  <span className="text-lg font-bold text-gray-900 leading-none">#{order.id.slice(0, 8)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleManualPrint(order)}
                    className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                    title="Imprimer le ticket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  </button>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${order.status === 'paid' ? 'bg-blue-50 text-blue-700' :
                    order.status === 'preparing' ? 'bg-orange-50 text-orange-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                    {order.status === 'pending' ? 'Attente Paiement' :
                      order.status === 'paid' ? 'Payé' :
                        order.status === 'preparing' ? 'Préparation' : 'Prête'}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="space-y-4 pt-2">
                  {order.order_items.map((it, i) => {
                    const c = it.customizations_json as any;
                    return (
                      <div key={i} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-black text-gray-900">
                            {it.quantity}× <span className="uppercase">{it.name_snapshot}</span>
                          </span>
                          <span className="text-xs font-bold text-gray-500">{eur(it.price_cents)}</span>
                        </div>

                        {c && (
                          <div className="text-[11px] text-gray-600 space-y-1 mt-1 pl-1">
                            {(c.size || c.base) && (
                              <div className="flex gap-2">
                                {c.size && <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold uppercase">Taille: {c.size}</span>}
                                {c.base && <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold uppercase">Base: {c.base}</span>}
                              </div>
                            )}

                            {c.meats?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-gray-400 font-bold">VIANDES:</span>
                                <span className="text-gray-800 font-medium uppercase">{c.meats.join(", ")}</span>
                              </div>
                            )}

                            {c.sauces?.length > 0 && <div className="italic"><span className="text-gray-400">SAUCES:</span> {c.sauces.join(", ")}</div>}
                            {c.sauce && <div className="italic font-bold text-gray-700"><span className="text-gray-400 font-normal">SAUCE:</span> {c.sauce}</div>}

                            {/* Extras */}
                            {(c.extras?.length > 0 || c.addedIngredients?.length > 0 || c.extraIngredients?.length > 0) && (
                              <div className="text-blue-600 font-bold bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/50">
                                + {[...(c.extras || []), ...(c.addedIngredients || []), ...(c.extraIngredients?.map((e: any) => e.name) || [])].join(", ")}
                              </div>
                            )}

                            {c.cheesy && <div className="text-amber-700 font-black bg-amber-50 p-1 rounded border border-amber-100 uppercase">🧀 Cheesy Crust</div>}
                            {c.pain && <div className="text-amber-700 font-black bg-amber-50 p-1 rounded border border-amber-100 uppercase">🥖 Pain Demande</div>}
                            {c.extraSalad && <div className="text-amber-700 font-black bg-amber-50 p-1 rounded border border-amber-100 uppercase">🥗 Salade Supp</div>}

                            {/* Retraits */}
                            {(c.removedIngredients?.length > 0 || c.removedSides?.length > 0 || c.removedVeggies?.length > 0) && (
                              <div className="text-red-500 italic font-bold">
                                SANS: {[...(c.removedIngredients || []), ...(c.removedSides || []), ...(c.removedVeggies || [])].join(", ")}
                              </div>
                            )}

                            {c.menu && <div className="font-extrabold text-emerald-700 flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              FORMULE MENU
                            </div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.reward_used && (
                <div className="mt-4 p-3 rounded-2xl bg-pink-50 border border-pink-100 flex items-center gap-3">
                  <span className="text-xl">🎁</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tight text-pink-400">Récompense utilisée</span>
                    <span className="text-xs font-black text-pink-700 uppercase">
                      {order.reward_used === 'pizza' ? '🍕 Pizza Offerte' : '🥤 Boisson Offerte'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                {order.mode && (
                  <div className={`mb-4 p-3 rounded-2xl flex items-center justify-between ${order.mode === 'delivery' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{order.mode === 'delivery' ? '🚚' : '🛍️'}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tight opacity-70">
                          {order.mode === 'delivery' ? 'Livraison' : 'À emporter'}
                        </span>
                        {order.delivery_address && (
                          <span className="text-xs font-bold leading-tight line-clamp-1">{order.delivery_address}</span>
                        )}
                      </div>
                    </div>
                    {order.phone && (
                      <a href={`tel:${order.phone}`} className="p-2 rounded-xl bg-white/50 hover:bg-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </a>
                    )}
                  </div>
                )}

                {view === "kitchen" && (
                  <div className="flex gap-3">
                    {order.status === "pending" && (
                      <button
                        onClick={() => updateStatus(order.id, "paid")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                      >
                        Confirmer Paiement
                      </button>
                    )}
                    {order.status === "paid" && (
                      <button
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                      >
                        Commencer
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => updateStatus(order.id, "ready")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                      >
                        Prête
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "loyalty" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4 text-center">Points cumulés</th>
                <th className="px-6 py-4 text-right">Dernière activité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loyaltyAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors italic">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{acc.user_id?.slice(0, 13) || "Invité"}</div>
                    <div className="text-[10px] text-gray-400 font-medium">Session UUID</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-black">
                      🎁 {acc.points} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">
                    {new Date(acc.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {loyaltyAccounts.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-400 font-bold">Aucun compte fidélité trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-gray-200 transition-all italic">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-black text-gray-900 leading-tight uppercase">{msg.name}</div>
                  <div className="text-xs font-bold text-blue-600 tracking-wide">{msg.email}</div>
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(msg.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                {msg.message}
              </p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold">
              Aucun message reçu pour le moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}


