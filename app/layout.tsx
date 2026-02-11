import "./globals.css";
import Header from "@/components/Header";
import PromoBar from "@/components/PromoBar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export const metadata = {
  title: {
    default: "Cassonnaise – Pizza, Tacos & Burgers à Casson",
    template: "%s | Cassonnaise",
  },
  description:
    "Pizza, tacos, burgers à Casson. Livraison gratuite dès 25€ jusqu’à 12 km ou retrait en magasin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 flex flex-col">
        
        {/* HEADER */}
        <Header />

        {/* PROMO BAR */}
        <PromoBar />

        {/* CONTENU */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        {/* FOOTER */}
        <Footer />

        {/* PANIER */}
        <CartDrawer />

      </body>
    </html>
  );
}