"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  label: string;
  priceKey?: "simple" | "medium" | "complex" | "maintenance";
  priceId?: string | null;
  activationPriceId?: string | null;
  addMaintenance?: boolean;
  mode?: "payment" | "subscription";
  variant?: "primary" | "outline";
}

export function CheckoutButton({
  label,
  priceKey,
  priceId,
  activationPriceId,
  addMaintenance = false,
  mode = "payment",
  variant = "primary"
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!activationPriceId && !priceId && !priceKey) return;
    setLoading(true);
    try {
      const payload = activationPriceId
        ? { activationPrice: activationPriceId, addMaintenance }
        : priceId
          ? { priceId, mode }
          : { plan: priceKey };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Impossible de lancer le paiement");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la redirection vers Stripe");
    } finally {
      setLoading(false);
    }
  };

  const baseStyles =
    "w-full rounded-2xl px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

  const variants = {
    primary: "bg-accent text-white hover:bg-[#4F46E5]",
    outline: "border border-accent text-accent hover:bg-[#EEF2FF]"
  };

  return (
    <button onClick={handleClick} className={`${baseStyles} ${variants[variant]}`} disabled={loading}>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : label}
    </button>
  );
}
