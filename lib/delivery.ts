// lib/delivery.ts
export type DeliveryResult =
  | { allowed: true; feeCents: number; free: boolean; distanceKm: number }
  | { allowed: false; feeCents: number; free: boolean; reason: string };

/**
 * Calcule les frais de livraison basés sur la distance et le montant du panier.
 * - Distance max: 12 km
 * - Gratuit à partir de 25€
 * - Sinon: 3.50€ (frais fixes)
 */
export function calculateDelivery(
  distanceKm: number | null,
  cartTotalCents: number
): DeliveryResult {
  const free = cartTotalCents >= 2500;
  const feeCents = free ? 0 : 350;

  if (distanceKm === null) {
    return {
      allowed: false,
      feeCents,
      free,
      reason: "Distance inconnue",
    };
  }

  // Max 12km
  if (distanceKm > 12) {
    return {
      allowed: false,
      feeCents: 0,
      free: false,
      reason: "Trop loin (max 12km)",
    };
  }

  return { allowed: true, feeCents, free, distanceKm };
}

