"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";

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

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/70">Prénom</label>
          <input
            value={values.firstName}
            onChange={handleChange("firstName")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-accent focus:outline-none"
            placeholder="Alex"
          />
          {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName}</p>}
        </div>
        <div>
          <label className="text-sm text-white/70">Email pro</label>
          <input
            value={values.email}
            onChange={handleChange("email")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-accent focus:outline-none"
            placeholder="prenom@entreprise.com"
            type="email"
          />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/70">URL du site</label>
          <input
            value={values.website}
            onChange={handleChange("website")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-accent focus:outline-none"
            placeholder="ex: agentable.fr"
          />
          {errors.website && <p className="mt-1 text-xs text-danger">{errors.website}</p>}
        </div>
        <div>
          <label className="text-sm text-white/70">Type de structure</label>
          <select
            value={values.structure}
            onChange={handleChange("structure")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-accent focus:outline-none"
          >
            {structureOptions.map((option) => (
              <option key={option} value={option} className="bg-background">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-indigo-400"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        <span>Recevoir mon audit gratuit →</span>
      </button>
      <p className="text-center text-sm text-white/60">Rapport livré sous 24h · Sans engagement · 100% gratuit</p>
      {message && (
        <p className={`text-center text-sm ${status === "success" ? "text-success" : "text-danger"}`}>{message}</p>
      )}
    </form>
  );
}
