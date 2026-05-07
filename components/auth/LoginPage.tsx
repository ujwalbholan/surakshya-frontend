"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, LockKeyhole, Mail } from "lucide-react";

const INITIAL_STATE: FormState = {
  email: "",
  password: "",
  remember: true,
};

type FormState = {
  email: string;
  password: string;
  remember: boolean;
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return form.email.trim().length > 0 && form.password.trim().length > 0;
  }, [form.email, form.password]);

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === "remember" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (error) setError("");
      if (success) setSuccess("");
    };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Placeholder API call point; replace with real auth endpoint integration.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSuccess("Login request accepted. Connecting your secure session...");
    } catch {
      setError("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 lg:px-10 lg:py-14 overflow-auto">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <section className="relative border border-[#222222] bg-[#0b0b0b] p-8 lg:p-10">
          <div className="mb-8 inline-flex items-center gap-3 border border-[#222222] bg-[#111111] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#c0392b]">
            <ShieldCheck className="h-4 w-4" />
            Secure Access
          </div>
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
            Welcome Back
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#b8b8b8] sm:text-base">
            Log in to Suraksha to manage emergency contacts, review incident
            timelines, and configure your wearable safety settings.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#222222] bg-[#0f0f0f] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
                Privacy
              </p>
              <p className="mt-2 text-sm text-[#d6d6d6]">
                End-to-end encrypted incident and location records.
              </p>
            </div>
            <div className="border border-[#222222] bg-[#0f0f0f] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
                Trust
              </p>
              <p className="mt-2 text-sm text-[#d6d6d6]">
                Session security controls with continuous monitoring.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-[#222222] bg-[#0a0a0a] p-8 lg:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-medium">Login</h2>
            <p className="mt-2 text-sm text-[#9a9a9a]">
              Use your registered email and password.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="you@example.com"
                  className="h-11 w-full border border-[#2a2a2a] bg-[#111111] pl-10 pr-4 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#c0392b]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange("password")}
                  placeholder="Enter your password"
                  className="h-11 w-full border border-[#2a2a2a] bg-[#111111] pl-10 pr-12 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#c0392b]"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-[#b4b4b4]">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={onChange("remember")}
                  className="h-4 w-4 border border-[#3a3a3a] bg-transparent accent-[#c0392b]"
                />
                Remember me
              </label>
              <Link
                href="#"
                className="text-xs uppercase tracking-[0.13em] text-[#c0392b] hover:text-[#e74c3c]"
              >
                Forgot Password
              </Link>
            </div>

            {error ? (
              <p className="border border-[#5a1f1f] bg-[#1a0e0e] px-3 py-2 text-sm text-[#ffb3b3]">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="border border-[#284729] bg-[#0e1a0f] px-3 py-2 text-sm text-[#b9efbb]">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="h-11 w-full border border-[#c0392b] bg-[#c0392b] text-sm uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#a83226] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <p className="pt-2 text-center text-sm text-[#9a9a9a]">
              New to Suraksha?{" "}
              <Link href="#" className="text-[#c0392b] hover:text-[#e74c3c]">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
