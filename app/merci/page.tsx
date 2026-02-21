export default function MerciPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-white">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Merci 🎉</p>
        <h1 className="text-4xl font-semibold">Commande reçue</h1>
        <p className="text-white/80">
          Ton paiement est confirmé. Notre agent IA lance la mise en conformité immédiatement. Tu recevras un email de
          confirmation via Resend avec le détail des prochaines étapes. Nouveau score garanti sous 48h.
        </p>
        <a href="/" className="inline-flex items-center rounded-2xl bg-accent px-6 py-3 text-white">
          Retour à l'accueil
        </a>
      </div>
    </section>
  );
}
