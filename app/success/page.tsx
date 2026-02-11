import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { eur } from "@/lib/format";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  console.log("🔍 SuccessPage orderId:", orderId);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="text-xl font-semibold text-red-600">ID de commande manquant</div>
          <p className="mt-2 text-gray-500">Nous n'avons pas pu récupérer les détails de votre commande dans l'URL.</p>
          <Link className="mt-6 inline-flex rounded-xl bg-[#1F5C3A] px-5 py-3 text-white" href="/">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createSupabaseServer();
  const [{ data: order }, { data: { user } }] = await Promise.all([
    supabase.from("orders").select("id,status,total_cents,created_at").eq("id", orderId).single(),
    supabase.auth.getUser()
  ]);

  console.log("🧾 Order data found:", order);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="text-xl font-semibold">Commande #{orderId} non trouvée</div>
          <p className="mt-2 text-gray-500">Votre paiement est peut-être en cours de traitement.</p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <button onClick={() => window.location.reload()} className="rounded-xl bg-gray-100 px-5 py-3">
              Actualiser la page
            </button>
            <Link className="text-[#1F5C3A] font-medium" href={user ? "/account/orders" : "/menu"}>
              {user ? "Voir mes commandes" : "Retour au menu"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-2xl font-bold">Merci 🎉</div>
        <p className="mt-2 text-sm text-gray-600">
          Votre commande a été enregistrée.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-600">Commande</div>
          <div className="mt-1 font-semibold">{order?.id}</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Statut</span>
            <span className="text-sm font-semibold uppercase">{order?.status ?? "—"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-sm font-semibold">{order ? eur(order.total_cents) : "—"}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {user ? (
            <Link className="rounded-xl bg-[#1F5C3A] px-5 py-3 text-white" href="/account/orders">
              Mes commandes
            </Link>
          ) : (
            <Link className="rounded-xl bg-[#1F5C3A] px-5 py-3 text-white" href="/menu">
              Retour au menu
            </Link>
          )}
          <Link className="rounded-xl bg-gray-100 px-5 py-3 text-gray-600 font-medium" href="/">
            Continuer
          </Link>
        </div>
      </div>
    </div>
  );
}


