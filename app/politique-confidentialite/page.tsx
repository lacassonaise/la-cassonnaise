export const metadata = {
    title: "Politique de confidentialité | La Cassonnaise",
    description:
        "Politique de confidentialité des données personnelles du restaurant La Cassonnaise.",
};

export default function PolitiqueConfidentialitePage() {
    return (
        <div className="mx-auto max-w-3xl px-5 py-10 space-y-6">
            <h1 className="text-3xl font-bold">Politique de confidentialité</h1>

            <p className="text-gray-700">
                La protection de vos données personnelles est une priorité pour La
                Cassonnaise. Cette politique détaille comment nous collectons, utilisons
                et protégeons vos informations.
            </p>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">1. Collecte des données</h2>
                <p>Nous collectons les informations suivantes lorsque vous passez commande :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Nom et prénom</li>
                    <li>Numéro de téléphone (pour le suivi de commande)</li>
                    <li>Adresse email (pour la confirmation de commande et le compte client)</li>
                    <li>Adresse de livraison (si applicable)</li>
                    <li>Historique de vos commandes</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">2. Utilisation des données</h2>
                <p>Vos données sont utilisées uniquement pour :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Traiter et livrer vos commandes.</li>
                    <li>Vous contacter en cas de problème avec une commande.</li>
                    <li>Gérer votre compte client et votre programme de fidélité.</li>
                    <li>Respecter nos obligations légales (comptabilité, facturation).</li>
                </ul>
                <p className="font-medium mt-2">
                    Nous ne revendons jamais vos données à des tiers à des fins publicitaires.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">3. Paiements sécurisés</h2>
                <p>
                    Les paiements en ligne sont traités par notre partenaire <strong>Stripe</strong>.
                    La Cassonnaise n’a jamais accès à vos coordonnées bancaires complètes.
                    Stripe assure la sécurité des transactions selon les normes les plus strictes (PCI-DSS).
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">4. Cookies</h2>
                <p>
                    Ce site utilise des cookies essentiels au fonctionnement du panier et de
                    l’espace client. Ces cookies ne sont pas utilisés à des fins de traçage publicitaire.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">5. Vos droits</h2>
                <p>
                    Conformément à la réglementation (RGPD), vous disposez d’un droit d’accès,
                    de rectification et de suppression de vos données.
                </p>
                <p>
                    Pour exercer ces droits ou supprimer votre compte, contactez-nous à :
                    <br />
                    <strong>Email :</strong> lacassonaise@gmail.com
                    <br />
                    <strong>Adresse :</strong> 3 rue Myotis, 44390 Casson
                </p>
            </section>

            <p className="pt-6 text-sm text-gray-500">
                Dernière mise à jour : 28 janvier 2026
            </p>
        </div>
    );
}
