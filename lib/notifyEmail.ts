import { Resend } from "resend";

export async function notifyRestaurant(orderId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing, skipping email notification.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "La Cassonnaise <no-reply@lacassonnaise.fr>",
      to: [process.env.RESTAURANT_EMAIL!],
      subject: "Nouvelle commande",
      html: `<p>Nouvelle commande : ${orderId}</p>`,
    });
  } catch (error) {
    console.error("Failed to send restaurant notification:", error);
  }
}

export async function notifyCustomer(email: string, orderId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing, skipping email notification.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "La Cassonnaise <no-reply@lacassonnaise.fr>",
      to: [email],
      subject: "Confirmation de commande",
      html: `<p>Votre commande ${orderId} a été confirmée.</p>`,
    });
  } catch (error) {
    console.error("Failed to send customer notification:", error);
  }
}