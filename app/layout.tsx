import "./globals.css";
import Header from "@/components/Header";
import PromoBar from "@/components/PromoBar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

export const metadata = {
  title: {
    default: "Cassonnaise – Pizza, Tacos & Burgers à Casson",
    template: "%s | Cassonnaise",
  },
  description:
    "Pizza, tacos, burgers à Casson. Livraison gratuite dès 25€ jusqu’à 12 km ou retrait en magasin.",
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Cassonnaise",
  image: "https://la-cassonnaise.vercel.app/logo.webp",
  "@id": "https://la-cassonnaise.vercel.app",
  url: "https://la-cassonnaise.vercel.app",
  telephone: "0982282214",
  address: {
    "@type": "PostalAddress",
    streetAddress: "3 Rue Myotis",
    addressLocality: "Casson",
    postalCode: "44390",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 47.3867, // These are approximate for Casson; ideally should be precise for 3 Rue Myotis
    longitude: -1.5583,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "11:00",
      closes: "14:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "18:00",
      closes: "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday"],
      opens: "18:00",
      closes: "22:00",
    },
  ],
  servesCuisine: ["Pizza", "Tacos", "Burger", "Fast Food"],
  priceRange: "€€",
  menu: "https://la-cassonnaise.vercel.app/menu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 flex flex-col">
        <JsonLd data={restaurantSchema} />

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