import { eur } from "@/lib/format";

type Order = {
  id: string;
  created_at: string;
  order_items: any[];
  total_cents: number;
  phone?: string;
  note?: string;
  mode?: "pickup" | "delivery";
  delivery_address?: string;
  delivery_fee_cents?: number;
};

export function OrderTicket({ order }: { order: Order }) {
  return (
    <div className="ticket">
      <div className="ticket__title">COMMANDE</div>
      <div className="ticket__meta">
        <div>ID: {order.id.slice(0, 6)}</div>
        <div>
          {new Date(order.created_at).toLocaleString("fr-FR")}
        </div>
      </div>

      <hr className="ticket__hr" />

      <div className="ticket__items">
        {order.order_items?.map((it, i) => {
          const c = it.customizations_json as any;
          return (
            <div key={i} className="ticket__item">
              <div className="ticket__line">
                <span className="ticket__qty">{it.quantity}×</span>
                <span className="ticket__name">{it.name_snapshot ?? "Produit"}</span>
                <span className="ticket__price">{eur(it.price_cents * it.quantity)}</span>
              </div>

              {c && (
                <div className="ticket__custom_details">
                  {c.size && <span>Taille: {c.size} </span>}
                  {c.base && <span>Base: {c.base}</span>}
                  {c.meats?.length > 0 && <div>Viandes: {c.meats.join(", ")}</div>}
                  {c.sauces?.length > 0 && <div>Sauces: {c.sauces.join(", ")}</div>}
                  {c.sauce && <div>Sauce: {c.sauce}</div>}
                  {c.extras?.length > 0 && <div className="ticket__extra">EXTRAS: {c.extras.join(", ")}</div>}
                  {c.addedIngredients?.length > 0 && <div className="ticket__extra">SUP: {c.addedIngredients.join(", ")}</div>}
                  {c.extraIngredients?.length > 0 && <div className="ticket__extra">SUP: {c.extraIngredients.map((e: any) => e.name).join(", ")}</div>}

                  {c.cheesy && <div className="ticket__extra">** CHEESY CRUST **</div>}
                  {c.pain && <div className="ticket__extra">** PAIN À LA DEMANDE **</div>}
                  {c.extraSalad && <div className="ticket__extra">** SALADE SUPP **</div>}

                  {c.removedIngredients?.length > 0 && <div className="ticket__sans">SANS: {c.removedIngredients.join(", ")}</div>}
                  {c.removedSides?.length > 0 && <div className="ticket__sans">SANS: {c.removedSides.join(", ")}</div>}
                  {c.removedVeggies?.length > 0 && <div className="ticket__sans">SANS: {c.removedVeggies.join(", ")}</div>}
                  {c.menu && <div className="ticket__menu">** FORMULE MENU **</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <hr className="ticket__hr" />

      <div className="ticket__total">
        TOTAL: {eur(order.total_cents)}
        {order.mode === "delivery" && order.delivery_fee_cents === 0 && (
          <div className="ticket__free_label">(LIVRAISON OFFERTE)</div>
        )}
      </div>

      {order.mode === "delivery" && (
        <>
          <hr className="ticket__hr" />
          <div className="ticket__delivery">
            LIVRAISON
            <div>{order.delivery_address}</div>
          </div>
        </>
      )}

      {order.phone && <div className="ticket__foot">TEL: {order.phone}</div>}
      {order.note && <div className="ticket__foot">NOTE: {order.note}</div>}
    </div>
  );
}

