"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ApiError, CARTOON_STYLES, CartoonStyle, Post, createPost, getPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { AlertIcon, CheckIcon, ShieldIcon, SparkleIcon, UploadIcon, XIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { TextArea } from "@/components/TextField";

const STATUS_COPY: Record<Post["status"], string> = strings.compose.status;
const STATUS_TITLE: Record<Post["status"], string> = strings.compose.statusTitle;

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ComposePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [style, setStyle] = useState<CartoonStyle>("anime");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local-only preview: an object URL never leaves the browser, so seeing
  // what you picked before posting does not weaken the promise that the
  // original photo is never stored server-side.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // Frees the previous object URL once it is no longer rendered, so picking
  // several photos in a row does not leak them for the life of the tab.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createPost(accessToken, file, caption, style);
      setPost(created);
      if (created.status === "pending") {
        pollRef.current = setInterval(async () => {
          const latest = await getPost(created.id);
          setPost(latest);
          if (latest.status !== "pending" && pollRef.current) {
            clearInterval(pollRef.current);
          }
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.compose.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  if (post) {
    const pending = post.status === "pending";
    const ready = post.status === "ready";
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div
          className="flex animate-pop-in flex-col items-center gap-4 rounded-2xl border border-border bg-bg-surface px-6 py-10 text-center shadow-card"
          aria-live="polite"
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              ready
                ? "bg-accent-success/12 text-accent-success"
                : pending
                  ? "bg-accent-primary/10 text-accent-primary-text"
                  : "bg-accent-danger/10 text-accent-danger"
            }`}
          >
            {ready ? (
              <CheckIcon className="h-6 w-6" />
            ) : pending ? (
              <SparkleIcon className="h-6 w-6 animate-pulse" />
            ) : (
              <AlertIcon className="h-6 w-6" />
            )}
          </span>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-xl font-bold">{STATUS_TITLE[post.status]}</h1>
            {/* The pending and ready titles already say what the status line
                says; only the two failure cases carry an explanation the
                title cannot fit. */}
            {!pending && !ready && (
              <p className="text-sm leading-relaxed text-text-secondary">
                {STATUS_COPY[post.status]}
              </p>
            )}
          </div>

          {/* Indeterminate on purpose: the cartoonize queue reports no real
              percentage, and inventing one would be a fake progress bar. */}
          {pending && (
            <>
              <div
                role="progressbar"
                aria-label={STATUS_COPY.pending}
                className="h-1 w-full max-w-[220px] overflow-hidden rounded-pill bg-bg-subtle"
              >
                <span className="brand-gradient block h-full w-full animate-indeterminate rounded-pill" />
              </div>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                {strings.compose.pendingHint}
              </p>
            </>
          )}

          {ready && (
            <>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                {strings.compose.readyHint}
              </p>
              <Button onClick={() => router.push("/feed")}>{strings.compose.viewFeed}</Button>
            </>
          )}

          {(post.status === "blocked" || post.status === "failed") && (
            <Button
              variant="secondary"
              onClick={() => setPost(null)}
            >
              {strings.compose.tryAgain}
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 lg:py-12">
      <PageHeader title={strings.compose.title} subtitle={strings.compose.subtitle} />

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <input
          ref={inputRef}
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {previewUrl && file ? (
          <div className="flex animate-pop-in flex-col gap-3 rounded-xl border border-border bg-bg-surface p-3 shadow-xs">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-bg-subtle">
              <Image
                src={previewUrl}
                alt={strings.compose.previewAlt}
                fill
                unoptimized
                className="object-cover"
              />
              <IconButton
                label={strings.compose.removePhoto}
                size="sm"
                onClick={clearFile}
                className="absolute top-2 right-2 bg-bg-elevated/90 text-text-primary shadow-card backdrop-blur-sm hover:bg-bg-elevated"
              >
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-primary">{file.name}</p>
                <p className="text-[11.5px] text-text-faint">{formatSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                {strings.compose.changePhoto}
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="image"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-[1.5px] border-dashed p-10 text-center transition-all duration-[var(--dur)] ease-out ${
              dragOver
                ? "scale-[1.01] border-accent-primary bg-accent-primary/8"
                : "border-border-strong hover:border-accent-primary hover:bg-bg-surface"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-[var(--dur)] ease-spring ${
                dragOver ? "scale-110 bg-accent-primary/15" : "bg-bg-subtle"
              }`}
            >
              <UploadIcon className="h-5 w-5 text-accent-primary-text" />
            </span>
            <strong className="text-[14px] font-semibold">
              {dragOver ? strings.compose.dropzoneActive : strings.compose.dropzoneLabel}
            </strong>
            <span className="text-xs leading-relaxed text-text-faint">
              {strings.compose.dropzoneHint}
            </span>
          </label>
        )}

        <fieldset className="flex flex-col">
          <legend className="mb-2 text-[13px] font-medium text-text-primary">
            {strings.compose.styleLabel}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {CARTOON_STYLES.map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2.5 transition-all duration-[var(--dur-fast)] ease-out has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-accent-primary/18 ${
                  style === s
                    ? "border-accent-primary bg-accent-primary/8 shadow-xs"
                    : "border-border bg-bg-surface hover:border-border-strong hover:bg-bg-subtle"
                }`}
              >
                <input
                  type="radio"
                  name="style"
                  value={s}
                  checked={style === s}
                  onChange={() => setStyle(s)}
                  className="sr-only"
                />
                <span className="text-[13.5px] font-semibold text-text-primary">
                  {strings.compose.styles[s].label}
                </span>
                <span className="text-[11.5px] leading-snug text-text-faint">
                  {strings.compose.styles[s].hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2.5 rounded-md border border-accent-primary/15 bg-accent-primary/8 p-3 text-xs leading-relaxed text-text-secondary">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary-text" />
          <span>{strings.compose.safetyNote}</span>
        </div>

        <TextArea
          id="caption"
          label={strings.compose.captionLabel}
          hint={strings.compose.captionHint}
          maxLength={280}
          rows={3}
          showCounter
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {error && (
          <p role="alert" className="text-sm text-accent-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={!file} loading={submitting} className="w-full">
          {submitting ? strings.compose.submitting : strings.compose.submit}
        </Button>
      </form>
    </main>
  );
}
