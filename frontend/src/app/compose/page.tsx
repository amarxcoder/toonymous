"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, CARTOON_STYLES, CartoonStyle, Post, createPost, getPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { ShieldIcon, UploadIcon } from "@/components/Icons";

const STATUS_COPY: Record<Post["status"], string> = strings.compose.status;

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

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
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
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-sm text-text-secondary">{STATUS_COPY[post.status]}</p>
        {post.status === "ready" && (
          <Button onClick={() => router.push("/feed")}>{strings.compose.viewFeed}</Button>
        )}
        {(post.status === "blocked" || post.status === "failed") && (
          <Button variant="secondary" onClick={() => setPost(null)}>
            {strings.compose.tryAgain}
          </Button>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12 lg:py-16">
      <h1 className="font-display text-2xl font-bold">{strings.compose.title}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label
          htmlFor="image"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed p-8 text-center transition-colors duration-150 ease-out ${
            dragOver ? "border-accent-primary bg-accent-primary/10" : "border-border-strong hover:border-accent-primary"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-base">
            <UploadIcon className="h-5 w-5 text-accent-primary-text" />
          </div>
          <strong className="text-[14px] font-semibold">
            {file ? file.name : strings.compose.dropzoneLabel}
          </strong>
          <span className="text-xs text-text-faint">{strings.compose.dropzoneHint}</span>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-text-primary">{strings.compose.styleLabel}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CARTOON_STYLES.map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border px-3 py-2.5 transition-colors duration-150 ease-out has-[:focus-visible]:border-accent-primary ${
                  style === s ? "border-accent-primary bg-accent-primary/10" : "border-border bg-bg-surface hover:border-accent-primary"
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
                <span className="text-sm font-semibold text-text-primary">{strings.compose.styles[s].label}</span>
                <span className="text-xs text-text-faint">{strings.compose.styles[s].hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2.5 rounded-[10px] bg-accent-primary/10 p-3 text-xs leading-relaxed text-text-secondary">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary-text" />
          <span>{strings.compose.safetyNote}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="caption" className="text-sm font-medium text-text-primary">
            {strings.compose.captionLabel}
          </label>
          <textarea
            id="caption"
            maxLength={280}
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded-[10px] border border-border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none focus-visible:border-accent-primary"
          />
        </div>
        {error && <p className="text-sm text-accent-danger">{error}</p>}
        <Button type="submit" disabled={submitting || !file} className="w-full">
          {submitting ? strings.compose.submitting : strings.compose.submit}
        </Button>
      </form>
    </main>
  );
}
