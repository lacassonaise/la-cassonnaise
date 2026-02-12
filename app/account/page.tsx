"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";


import { eur } from "@/lib/format";
import { useRouter } from "next/navigation";

/* =====================
   TYPES
===================== */
type Order = {
  id: string;
  created_at: string;
  total_cents: number;
  status: string;
  mode: string;
};

/* =====================
   PAGE
===================== */
export default function ComptePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // State pour changement de mot de passe
  const [newPassword, setNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  async function updatePassword() {
    if (!newPassword) return;
    setLoadingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Mot de passe mis à jour avec succès !");
      setNewPassword("");
    }

    setLoadingPassword(false);
  }

  useEffect(() => {
    load();

    // 🔐 Écoute les changements d’auth (login / logout / reset)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        alert("Vous êtes connecté en mode récupération. Veuillez changer votre mot de passe ci-dessous.");
      }

      if (!session) {
        setOrders([]);
        setLoyaltyPoints(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, created_at, total_cents, status, mode")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);

      // 🎁 FIDÉLITÉ
      const { data: loyalty } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("user_id", user.id)
        .single();

      setLoyaltyPoints(loyalty?.points ?? 0);
    }

    setLoading(false);
  }

  async function deleteOrder(e: React.MouseEvent, orderId: string) {
    e.stopPropagation(); // Évite d'ouvrir les détails
    if (!confirm("Voulez-vous supprimer cette commande de votre historique ?")) return;

    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setOrders([]);
      setLoyaltyPoints(0);
      router.push("/account");
    }
  }

  /* =====================
     STATES
  ===================== */

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={load} />;
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 space-y-8">
      {/* PROFIL */}
      <div className="rounded-3xl bg-white p-6 shadow ring-1 ring-black/5">
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <p className="mt-1 text-sm text-gray-600">{user.email}</p>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.push("/menu")}
            className="rounded-xl bg-[#1F5C3A] px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all"
          >
            🍕 Passer une commande
          </button>
          <button
            onClick={logout}
            className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {/* SÉCURITÉ */}
      <div className="rounded-3xl bg-white p-6 shadow ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Sécurité</h2>
        <div className="mt-4 max-w-sm">
          <label className="block text-sm font-semibold text-gray-700">Nouveau mot de passe</label>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 rounded-xl border px-3 py-2 text-sm focus:border-[#9C5A2E] focus:ring-[#9C5A2E] outline-none"
            />
            <button
              onClick={updatePassword}
              disabled={loadingPassword || !newPassword}
              className="rounded-xl bg-[#9C5A2E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#7a4623] transition-colors"
            >
              {loadingPassword ? "..." : "Modifier"}
            </button>
          </div>
        </div>
      </div>

      {/* FIDÉLITÉ PREMIUM */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1F5C3A] to-[#154029] p-8 shadow-xl text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest">
              ✨ Programme Fidélité
            </div>
            <h2 className="text-4xl font-black">
              {loyaltyPoints} <span className="text-xl font-medium opacity-80">points</span>
            </h2>
            <p className="text-sm text-emerald-100/80 italic font-medium">
              1 € dépensé = 1 point cumulé
            </p>
          </div>

          <div className="flex-1 max-w-sm space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-90">
              <span>Prochain palier</span>
              <span>{loyaltyPoints >= 50 ? 'Prêt !' : `${50 - loyaltyPoints} pts restants`}</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={{ width: `${Math.min((loyaltyPoints / 50) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex gap-4 justify-around pt-2">
              <div className={`flex flex-col items-center gap-1 opacity-${loyaltyPoints >= 50 ? '100' : '50'}`}>
                <span className="text-2xl">🥤</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Boisson (50)</span>
              </div>
              <div className={`flex flex-col items-center gap-1 opacity-${loyaltyPoints >= 100 ? '100' : '50'}`}>
                <span className="text-2xl">🍕</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Pizza (100)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMANDES */}
      <div className="rounded-3xl bg-white p-6 shadow ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Mes commandes</h2>

        {orders.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            Aucune commande pour le moment.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="relative group bg-white rounded-xl border hover:border-red-100 hover:bg-red-50/10 transition-all flex items-center"
            >
              <button
                onClick={() => router.push(`/account/order`)}
                className="flex-1 text-left px-4 py-3 flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 leading-tight">Commande #{o.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(o.created_at).toLocaleDateString("fr-FR")} • {o.mode === "delivery" ? "🚚 Livraison" : "🛍️ À emporter"}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="font-black text-gray-900">{eur(o.total_cents)}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${["paid", "preparing", "ready", "completed"].includes(o.status)
                    ? "text-emerald-600"
                    : "text-orange-600"
                    }`}>
                    {o.status === "paid" ? "Payée" :
                      o.status === "preparing" ? "En préparation" :
                        o.status === "ready" ? "Prête" :
                          o.status === "completed" ? "Terminée" : "En attente"}
                  </span>
                </div>
              </button>

              <button
                onClick={(e) => deleteOrder(e, o.id)}
                className="p-3 mr-1 text-gray-300 hover:text-red-500 transition-colors"
                title="Supprimer la commande"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================
   AUTH FORM
===================== */
function AuthForm({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setLoading(true);
    setMsg("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setMsg(error ? error.message : "Compte créé. Vérifie ton email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMsg(error.message);
      else onAuth();
    }

    setLoading(false);
  }

  async function resetPassword() {
    if (!email) {
      setMsg("Entre ton email d’abord.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/account",
    });
    setMsg(error ? error.message : "Email de réinitialisation envoyé.");
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow ring-1 ring-black/5">
      <h1 className="text-2xl font-bold">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h1>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${mode === "login" ? "bg-[#9C5A2E] text-white border-[#9C5A2E]" : "hover:bg-gray-50"
            }`}
        >
          Connexion
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${mode === "signup" ? "bg-[#9C5A2E] text-white border-[#9C5A2E]" : "hover:bg-gray-50"
            }`}
        >
          Créer un compte
        </button>
      </div>

      <label className="mt-4 block text-sm font-semibold">Email</label>
      <input
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemple.com"
      />

      <label className="mt-4 block text-sm font-semibold">
        Mot de passe
      </label>
      <input
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {mode === "login" && (
        <button
          onClick={resetPassword}
          className="mt-3 text-xs text-gray-600 hover:underline"
        >
          Mot de passe oublié ?
        </button>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-[#9C5A2E] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#7a4623] transition-colors"
      >
        {loading
          ? "Chargement…"
          : mode === "login"
            ? "Se connecter"
            : "Créer mon compte"}
      </button>

      {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}



