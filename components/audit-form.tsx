"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

const structureOptions = [
  "Freelance",
  "Agence",
  "PME-TPE",
  "Artisan",
  "Profession libérale",
  "E-commerce",
  "Autre"
];

type FormState = {
  firstName: string;
  email: string;
  website: string;
  structure: string;
};

const initialState: FormState = {
  firstName: "",
  email: "",
  website: "",
  structure: structureOptions[0]
};

export function AuditForm() {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const validate = () => {
    const nextErrors: Partial<FormState> = {};
    if (values.firstName.trim().length < 2) nextErrors.firstName = "Prénom invalide";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Email invalide";
    try {
      const url = new URL(values.website.startsWith("http") ? values.website : `https://${values.website}`);
      if (!url.hostname) throw new Error();
    } catch (error) {
      nextErrors.website = "URL invalide";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setMessage("");

    const payload = {
      firstName: values.firstName.trim(),
      email: values.email.trim().toLowerCase(),
      website: values.website.trim(),
      structure: values.structure
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setStatus("success");
      setMessage("Audit reçu ! Tu auras ton score sous 24h.");
      setValues(initialState);
    } else {
      setStatus("error");
      const { error } = await response.json().catch(() => ({ error: "Erreur" }));
      setMessage(error || "Une erreur est survenue.");
    }
  };

  const inputBase =
    "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-night transition focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Prénom</label>
          <input value={values.firstName} onChange={handleChange("firstName")} className={inputBase} placeholder="Alex" />
          {errors.firstName && <p className="mt-2 text-xs text-danger">{errors.firstName}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Email pro</label>
          <input
            value={values.email}
            onChange={handleChange("email")}
            className={inputBase}
            placeholder="prenom@entreprise.com"
            type="email"
          />
          {errors.email && <p className="mt-2 text-xs text-danger">{errors.email}</p>}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">URL du site</label>
          <input
            value={values.website}
            onChange={handleChange("website")}
            className={inputBase}
            placeholder="agentable.fr"
            inputMode="url"
          />
          {errors.website && <p className="mt-2 text-xs text-danger">{errors.website}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Type de structure</label>
          <select value={values.structure} onChange={handleChange("structure")} className={inputBase}>
            {structureOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-[0_8px_28px_rgba(99,102,241,0.35)] transition hover:bg-[#4F46E5] disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {status === "loading" ? "Envoi en cours..." : "Recevoir mon audit gratuit"}
      </button>
      <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate">
        <span className="rounded-full bg-surface px-3 py-1">✓ 24h</span>
        <span className="rounded-full bg-surface px-3 py-1">✓ Sans engagement</span>
        <span className="rounded-full bg-surface px-3 py-1">✓ 100% gratuit</span>
      </div>
      <p className="flex items-center justify-center gap-2 text-xs text-slate">
        <ShieldCheck className="h-4 w-4 text-accent" /> Données protégées · RGPD · Jamais revendues
      </p>
      {message && (
        <p className={`text-center text-sm font-medium ${status === "success" ? "text-success" : "text-danger"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
