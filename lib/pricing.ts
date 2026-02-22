export const MAINTENANCE_PRICE = 79;

export function getActivationPrice(score: number) {
  if (score > 60) {
    return {
      price: 249,
      label: "Site simple",
      stripePrice: process.env.STRIPE_PRICE_SIMPLE
    };
  }
  if (score >= 40) {
    return {
      price: 390,
      label: "Site moyen",
      stripePrice: process.env.STRIPE_PRICE_MEDIUM
    };
  }
  return {
    price: 590,
    label: "Site complexe",
    stripePrice: process.env.STRIPE_PRICE_COMPLEX
  };
}
