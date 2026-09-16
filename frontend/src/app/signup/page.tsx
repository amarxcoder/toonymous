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

export default function SignupPage() {
  const { signup } = useAuth();
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
      await signup(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.signup.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={strings.signup.title}
      subtitle={strings.signup.subtitle}
      footer={
        <>
          {strings.signup.loginPrompt}{" "}
          <Link href="/login" className="font-semibold text-accent-primary-text hover:underline">
            {strings.signup.loginLink}
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
          autoComplete="new-password"
          minLength={8}
          required
          hint={strings.signup.passwordHint}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-accent-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? strings.signup.submitting : strings.signup.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}
