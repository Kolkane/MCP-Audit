export const MAINTENANCE_PRICE = 79;
export const MAINTENANCE_ENV_KEY = "STRIPE_PRICE_MAINTENANCE";

export const PRICE_LEVELS = [
  { threshold: 60, label: "Site bien structuré", price: 249, color: "green", niveau: "simple" },
  { threshold: 40, label: "Optimisations modérées", price: 390, color: "orange", niveau: "moyen" },
  { threshold: -Infinity, label: "Refonte complète", price: 590, color: "red", niveau: "complexe" }
];

export type PricingInfo = {
  niveau: "simple" | "moyen" | "complexe";
  label: string;
  prixActivation: number;
  stripeEnvKey: "STRIPE_PRICE_SIMPLE" | "STRIPE_PRICE_MEDIUM" | "STRIPE_PRICE_COMPLEX";
};

export function getPricing(score: number): PricingInfo {
  if (score > 60) {
    return {
      niveau: "simple",
      label: "Site bien structuré",
      prixActivation: 249,
      stripeEnvKey: "STRIPE_PRICE_SIMPLE"
    };
  }
  if (score >= 40) {
    return {
      niveau: "moyen",
      label: "Optimisations modérées",
      prixActivation: 390,
      stripeEnvKey: "STRIPE_PRICE_MEDIUM"
    };
  }
  return {
    niveau: "complexe",
    label: "Refonte complète",
    prixActivation: 590,
    stripeEnvKey: "STRIPE_PRICE_COMPLEX"
  };
}
