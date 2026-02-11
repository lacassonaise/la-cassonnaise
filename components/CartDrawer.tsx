"use client";

import { eur } from "@/lib/format";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/store/cart";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const cart = useCart();

  const total = cart.totalCents();
  const count = cart.count();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#1F5C3A] px-5 py-3 text-white shadow-lg"
      >
        <span className="text-sm font-semibold">Panier</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
          {count}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="text-lg font-bold">Votre panier</div>
          <button onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="flex-1 overflow-auto px-5 space-y-4">
          {cart.items.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              Votre panier est vide 🍕
            </div>
          ) : (
            cart.items.map((it) => {
              const c = it.customizations as any;

              return (
                <div key={it.id} className="flex gap-3 rounded-2xl bg-gray-50 p-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      {it.nameSnapshot ?? "Produit"}
                    </div>

                    <div className="text-xs text-gray-400">
                      {eur(it.priceCents)} / unité
                    </div>

                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      {/* Structure config standard (Tacos, Assiettes, Burgers, etc.) */}
                      {(c?.size || c?.base) && (
                        <div className="font-medium text-gray-700 capitalize">
                          {c.size && <span>Taille: {c.size}</span>}
                          {c.size && c.base && <span> • </span>}
                          {c.base && <span>Base: {c.base}</span>}
                        </div>
                      )}

                      {c?.meats?.length > 0 && <div>Viandes: {c.meats.join(", ")}</div>}
                      {c?.sauces?.length > 0 && <div>Sauces: {c.sauces.join(", ")}</div>}
                      {c?.sauce && <div>Sauce: {c.sauce}</div>}

                      {/* Extras */}
                      {c?.extras?.length > 0 && <div className="text-green-600">Extras: {c.extras.join(", ")}</div>}
                      {c?.addedIngredients?.length > 0 && <div className="text-green-600">Supp: {c.addedIngredients.join(", ")}</div>}
                      {c?.extraIngredients?.length > 0 && (
                        <div className="text-green-600 font-medium">
                          Supp: {c.extraIngredients.map((e: any) => e.name).join(", ")}
                        </div>
                      )}

                      {c?.cheesy && <div className="text-amber-600 font-bold">Cheesy Crust 🧀</div>}
                      {c?.pain && <div className="text-amber-600 font-bold">Pain à la demande 🥖</div>}
                      {c?.extraSalad && <div className="text-amber-600 font-bold">Salade supp. 🥗</div>}

                      {/* Retraits */}
                      {c?.removedIngredients?.length > 0 && (
                        <div className="text-red-500 italic uppercase text-[10px]">
                          Sans: {c.removedIngredients.join(", ")}
                        </div>
                      )}
                      {c?.removedSides?.length > 0 && (
                        <div className="text-red-500 italic text-[10px]">
                          Sans: {c.removedSides.join(", ")}
                        </div>
                      )}
                      {c?.removedVeggies?.length > 0 && (
                        <div className="text-red-500 italic text-[10px]">
                          Sans: {c.removedVeggies.join(", ")}
                        </div>
                      )}

                      {c?.menu && <div className="font-bold text-[#1F5C3A]">Formule Menu 🍟🥤</div>}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-sm border border-gray-100">
                        <button onClick={() => cart.dec(it.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">−</button>
                        <span className="text-sm font-medium w-4 text-center">{it.quantity}</span>
                        <button onClick={() => cart.inc(it.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">+</button>
                      </div>

                      <button
                        onClick={() => cart.remove(it.id)}
                        className="ml-auto text-xs text-red-600 font-medium"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-4">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-bold">{eur(total)}</span>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={cart.clear} className="w-1/2 bg-amber-600/10 text-center text-amber-700 rounded-xl py-3">
              Vider
            </button>

            <Link href="/checkout" onClick={() => setOpen(false)} className="w-1/2 bg-[#1F5C3A] text-center text-white rounded-xl py-3">
              Commander
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}




