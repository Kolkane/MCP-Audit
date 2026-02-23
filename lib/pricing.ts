export const MAINTENANCE_PRICE = 79;

export const PRICE_LEVELS = [
  { threshold: 60, price: 249, label: "Site bien structuré", color: "green" },
  { threshold: 40, price: 390, label: "Optimisations modérées", color: "orange" },
  { threshold: -Infinity, price: 590, label: "Refonte complète", color: "red" }
];

export function getActivationPrice(score: number) {
  if (score > 60) {
    return {
      price: 249,
      label: "Site bien structuré",
      stripePrice: process.env.STRIPE_PRICE_SIMPLE
    };
  }
  if (score >= 40) {
    return {
      price: 390,
      label: "Optimisations modérées",
      stripePrice: process.env.STRIPE_PRICE_MEDIUM
    };
  }
  return {
    price: 590,
    label: "Refonte complète",
    stripePrice: process.env.STRIPE_PRICE_COMPLEX
  };
}
