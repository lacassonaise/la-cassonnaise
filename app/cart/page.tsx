"use client";

import { useCart } from "@/store/cart";

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return <p className="p-6">Panier vide</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Panier</h1>

      {cart.items.map((item) => (
        <div key={item.id} className="border rounded-xl p-4 space-y-2">
          <div className="font-semibold">{item.nameSnapshot}</div>

          <div className="text-sm text-gray-600">
            Taille : {item.customizations.size}
          </div>

          {(item.customizations.removedIngredients?.length ?? 0) > 0 && (
            <div className="text-sm text-red-600">
              ❌ Sans :
              {item.customizations.removedIngredients?.join(", ")}
            </div>
          )}

          {(item.customizations.extraIngredients?.length ?? 0) > 0 && (
            <div className="text-sm text-green-700">
              ➕ Suppléments :
              {item.customizations.extraIngredients?.map((e) => (
                <div key={e.name}>
                  {e.name} (+{(e.priceCents / 100).toFixed(2)} €)
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <span>
              {item.quantity} ×{" "}
              {((item.priceCents) / 100).toFixed(2)} €
            </span>
            <span className="font-semibold">
              {(
                (item.priceCents +
                  (item.customizations.extraIngredients?.reduce(
                    (t, e) => t + e.priceCents,
                    0
                  ) ?? 0)) *
                item.quantity /
                100
              ).toFixed(2)} €
            </span>
          </div>

          <button
            onClick={() => cart.remove(item.id)}
            className="text-xs text-red-600"
          >
            Supprimer
          </button>
        </div>
      ))}

      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>{(cart.totalCents() / 100).toFixed(2)} €</span>
      </div>
    </div>
  );
}

