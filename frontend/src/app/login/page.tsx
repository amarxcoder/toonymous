"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import { TextField } from "@/components/TextField";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.login.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={44} />
        <h1 className="font-display text-2xl font-bold">{strings.login.title}</h1>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-accent-danger">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? strings.login.submitting : strings.login.submit}
        </Button>
      </form>
      <p className="text-sm text-text-secondary">
        {strings.login.signupPrompt}{" "}
        <Link href="/signup" className="text-accent-primary-text hover:underline">
          {strings.login.signupLink}
        </Link>
      </p>
    </main>
  );
}
