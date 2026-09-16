"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { strings } from "@/lib/strings";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
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
    <AuthLayout
      title={strings.login.title}
      subtitle={strings.login.subtitle}
      footer={
        <>
          {strings.login.signupPrompt}{" "}
          <Link
            href="/signup"
            className="font-semibold text-accent-primary-text hover:underline"
          >
            {strings.login.signupLink}
          </Link>
        </>
      }
    >
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
        {/* Auth failures are reported in the form, not as a toast: the fix
            is right here in these two fields. */}
        {error && (
          <p role="alert" className="text-sm text-accent-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? strings.login.submitting : strings.login.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}
