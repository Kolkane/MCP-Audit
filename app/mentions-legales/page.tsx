export default function MentionsLegales() {
  return (
    <section className="mx-auto min-h-screen max-w-4xl space-y-6 bg-background px-6 py-16 text-white">
      <h1 className="text-4xl font-semibold">Mentions légales</h1>
      <div className="space-y-4 text-white/80">
        <p>
          <strong>Agentable</strong> — service édité par MCP Audit SAS · 18 rue des Agents IA · 75002 Paris · RCS Paris 123 456
          789 · TVA FR12 3456789.
        </p>
        <p>Directeur de la publication : Sebastien — contact@agentable.fr — +33 6 12 34 56 78.</p>
        <p>Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        <p>Protection des données : déclaration simplifiée CNIL. Pour toute demande RGPD → privacy@agentable.fr.</p>
        <p>Les prix mentionnés sont hors taxes. Les paiements sont traités via Stripe. Conditions complètes disponibles sur demande.</p>
      </div>
      <a href="/" className="inline-flex items-center text-accent">
        ← Retour à l'accueil
      </a>
    </section>
  );
}
