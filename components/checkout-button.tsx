"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  label: string;
  priceKey: "starter" | "pro" | "maintenance";
  variant?: "primary" | "outline";
}

export function CheckoutButton({ label, priceKey, variant = "primary" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: priceKey })
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
    "w-full rounded-2xl px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  const variants = {
    primary: "bg-accent text-white hover:bg-indigo-400",
    outline: "border border-white/30 text-white hover:border-white"
  };

  return (
    <button onClick={handleClick} className={`${baseStyles} ${variants[variant]}`} disabled={loading}>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : label}
    </button>
  );
}
