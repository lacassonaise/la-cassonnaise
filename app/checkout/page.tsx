"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { eur } from "@/lib/format";
import { calculateDelivery } from "@/lib/delivery";
import { supabase } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();

  const baseTotal = cart.totalCents();
  const canDeliver = cart.canDeliver();

  /* =====================
     STATES
  ===================== */

  /* =====================
     STATES
  ===================== */

  const [deliveryType, setDeliveryType] =
    useState<"pickup" | "delivery">("pickup");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  
  // Debug to verify latest code is active in production
  const CODE_VERSION = "2026-03-16-1550"; 

  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  /* =====================
     AUTH EFFECT (To pre-fill email)
  ===================== */
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
    }
    loadUser();
  }, []);

  /* =====================
     DISTANCE CALCULATION
  ===================== */

  async function calculateDistance() {
    if (!address || !city) return null;

    setIsCalculatingDistance(true);
    // Simulation d'appel API Google Maps (Distance Matrix)
    await new Promise(r => setTimeout(r, 800));

    // Valeur simulée basées sur le code postal pour l'exemple
    const simDistance = postalCode.startsWith("44") ? 5.5 : 15;
    setDistanceKm(simDistance);
    setIsCalculatingDistance(false);
    return simDistance;
  }

  /* =====================
     REWARDS
  ===================== */

  const rewards = ["pizza", "drink"] as const;
  type Reward = (typeof rewards)[number];
  const [rewardUsed, setRewardUsed] = useState<Reward | null>(null);

  const cartHasPizza = cart.items.some((i) =>
    i.nameSnapshot?.toLowerCase().includes("pizza")
  );

  const cartHasDrink = cart.items.some((i) =>
    i.nameSnapshot?.toLowerCase().includes("boisson")
  );

  /* =====================
     LIVRAISON
  ===================== */

  const [deliveryResult, setDeliveryResult] =
    useState<ReturnType<typeof calculateDelivery> | null>(null);

  useEffect(() => {
    if (deliveryType === "delivery") {
      const result = calculateDelivery(distanceKm, baseTotal);
      setDeliveryResult(result);
    } else {
      setDeliveryResult(null);
    }
  }, [deliveryType, baseTotal, distanceKm]);

  /* =====================
     PRIX FINAL
  ===================== */

  const deliveryFee =
    deliveryType === "delivery" && deliveryResult
      ? deliveryResult.feeCents
      : 0;

  const finalTotal = baseTotal + deliveryFee;

  /* =====================
     CONTINUER
  ===================== */

  const continueToPayment = async () => {
    console.log("🔘 Bouton de paiement cliqué !");

    try {
      if (deliveryType === "delivery") {
        if (!address || !city) {
          alert("Veuillez saisir une adresse et une ville pour la livraison");
          return;
        }

        let currentDistance = distanceKm;
        if (currentDistance === null) {
          console.log("⌛ Distance non calculée, tentative de calcul automatique...");
          currentDistance = await calculateDistance();
        }

        // Re-vérification après calcul
        const currentResult = calculateDelivery(currentDistance, baseTotal);
        if (!currentResult.allowed) {
          console.error("❌ Livraison impossible :", currentResult.reason);
          alert("Livraison impossible : " + currentResult.reason);
          return;
        }
      }

      if (!phone) {
        console.warn("⚠️ Téléphone manquant");
        alert("Veuillez saisir votre numéro de téléphone");
        return;
      }

      if (!email) {
        console.warn("⚠️ Email manquant");
        alert("Une adresse email est requise pour le paiement");
        return;
      }

      console.log("👤 Vérification de l'utilisateur...");
      let currentUserId = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id || null;
      } catch (e) {
        console.warn("⚠️ Impossible de récupérer l'utilisateur (non bloquant):", e);
      }

      console.log("🚀 Envoi de la commande à l'API... (total:", finalTotal, "cents)");
      const orderPayload = {
        items: cart.items,
        totalCents: Math.round(finalTotal), // Sécurité pour Stripe (entier)
        deliveryType,
        deliveryFeeCents: deliveryFee,
        deliveryFree: (deliveryResult as any)?.free ?? false,
        distanceKm: distanceKm,
        phone,
        email, // <--- AJOUTÉ
        note,
        address,
        city,
        postalCode,
        rewardUsed,
        userId: currentUserId,
      };

      console.log("📤 Payload envoyé (userId link):", orderPayload);

      const orderRes = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      console.log("📡 Réponse API /order:", orderRes.status);

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        console.error("❌ Erreur API /order:", errorData);
        alert("Erreur: " + (errorData.detail || errorData.error || "Inconnue"));
        return;
      }

      const { url } = await orderRes.json();
      console.log("🔗 URL reçue de l'API:", url);

      if (url) {
        console.log("🔜 Redirection vers Stripe en cours...");
        window.location.href = url;
      } else {
        console.error("❌ Pas d'URL Stripe dans la réponse");
        alert("Erreur: Le serveur n'a pas renvoyé d'URL de paiement.");
      }
    } catch (err: any) {
      console.error("🔥 Erreur critique dans continueToPayment:", err);
      alert("Une erreur inattendue est survenue : " + err.message);
    }
  }

  /* =====================
     GUARD
  ===================== */

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p>Ton panier est vide</p>
      </div>
    );
  }

  /* =====================
     RENDER
  ===================== */

  const card =
    "rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">
        Finaliser la commande
      </h1>

      <div className="grid gap-10 md:grid-cols-2">
        {/* RÉCAP */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-6 text-black">
            Récapitulatif
          </h2>

          <div className="space-y-4 max-h-[400px] overflow-auto mb-6 pr-2">
            {cart.items.map((it) => {
              const c = it.customizations as any;
              return (
                <div key={it.id} className="py-3 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-black">
                        {it.quantity} × {it.nameSnapshot}
                      </div>

                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        {/* Structure config standard (Tacos, Assiettes, etc.) */}
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

                        {/* Extras spécifique au configurateur Tacos ou génériques */}
                        {c?.extras?.length > 0 && <div className="text-green-600">Extras: {c.extras.join(", ")}</div>}
                        {c?.addedIngredients?.length > 0 && <div className="text-green-600">Supp: {c.addedIngredients.join(", ")}</div>}
                        {c?.extraIngredients?.length > 0 && (
                          <div className="text-green-600">Supp: {c.extraIngredients.map((e: any) => e.name).join(", ")}</div>
                        )}

                        {c?.cheesy && <div className="text-amber-600 font-bold">Options: Cheesy Crust 🧀</div>}
                        {c?.pain && <div className="text-amber-600 font-bold">Options: Pain à la demande 🥖</div>}
                        {c?.extraSalad && <div className="text-amber-600 font-bold">Options: Salade supp. 🥗</div>}

                        {/* Retraits */}
                        {c?.removedIngredients?.length > 0 && (
                          <div className="text-red-500 italic">Sans: {c.removedIngredients.join(", ")}</div>
                        )}
                        {c?.removedSides?.length > 0 && <div className="text-red-500 italic">Sans: {c.removedSides.join(", ")}</div>}
                        {c?.removedVeggies?.length > 0 && <div className="text-red-500 italic">Sans: {c.removedVeggies.join(", ")}</div>}

                        {c?.menu && <div className="font-bold text-[#1F5C3A]">Formule Menu 🍟🥤</div>}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {eur(it.priceCents * it.quantity)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t-2 border-gray-100">
            <div className="flex justify-between text-black">
              <span>Sous-total</span>
              <span>{eur(baseTotal)}</span>
            </div>

            {deliveryType === "delivery" && (
              <div className="flex justify-between text-black">
                <span>
                  Livraison{" "}
                  {deliveryResult && deliveryResult.free && (
                    <span className="text-green-600 text-sm">(offerte dès 25€)</span>
                  )}
                </span>
                <span>
                  {deliveryResult
                    ? (deliveryResult.free ? "0.00 €" : eur(deliveryResult.feeCents))
                    : "—"}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-xl pt-2 text-black">
              <span>Total</span>
              <span className="text-[#1F5C3A]">
                {eur(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className={card + " space-y-6"}>
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setDeliveryType("pickup")}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${deliveryType === "pickup" ? "bg-white shadow-sm" : "text-gray-500"}`}
            >
              À emporter
            </button>
            <button
              disabled={!canDeliver}
              onClick={() => setDeliveryType("delivery")}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-30 ${deliveryType === "delivery" ? "bg-white shadow-sm" : "text-gray-500"}`}
            >
              Livraison
            </button>
          </div>

          {!canDeliver && (
            <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg">
              ⚠️ Certains produits de votre panier sont uniquement disponibles à emporter.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:bg-white focus:ring-[#1F5C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email (requis pour le paiement)</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:bg-white focus:ring-[#1F5C3A]"
                required
              />
            </div>
            
            <div className="text-[8px] text-gray-200 text-right">v.{CODE_VERSION}</div>

            {deliveryType === "delivery" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Code Postal</label>
                    <input
                      type="text"
                      placeholder="44000"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-4"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ville</label>
                    <input
                      type="text"
                      placeholder="Nantes"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-4"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adresse</label>
                  <input
                    type="text"
                    placeholder="12 rue de la Paix"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={calculateDistance}
                    className="w-full rounded-xl border-gray-200 bg-gray-50 p-4"
                  />
                </div>

                {isCalculatingDistance && (
                  <p className="text-xs text-blue-500 italic">Vérification de la zone de livraison...</p>
                )}

                {distanceKm !== null && deliveryResult?.allowed === false && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    ❌ {(deliveryResult as any).reason}
                  </p>
                )}

                {distanceKm !== null && deliveryResult?.allowed === true && (
                  <p className="text-xs text-green-600 font-medium px-1">
                    ✅ Zone de livraison validée ({distanceKm} km)
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Note pour le livreur (optionnel)</label>
              <textarea
                placeholder="Code porte, étage..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 h-24"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={continueToPayment}
            className="w-full rounded-2xl bg-[#1F5C3A] hover:bg-[#164329] py-5 text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-green-900/10 flex items-center justify-center gap-3"
            style={{ position: 'relative', zIndex: 100 }}
          >
            CONTINUER VERS LE PAIEMENT
          </button>
        </div>
      </div>
    </div>
  );
}
