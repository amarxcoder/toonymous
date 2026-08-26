"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, Comment, Post, createComment, getComments, getPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { PostCard } from "@/components/PostCard";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          getPost(id, accessToken ?? undefined),
          getComments(id, accessToken ?? undefined),
        ]);
        setPost(p);
        setComments(c.comments);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : strings.postDetail.loadError);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await createComment(accessToken, id, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.postDetail.commentError);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !post) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-accent-danger">{error}</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-text-secondary">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <PostCard post={post} />

      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-0.5 rounded-[10px] border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold">{c.handle}</span>
              <span className="text-xs text-text-faint">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm text-text-primary">{c.text}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-text-secondary">
            {strings.postDetail.noComments}
          </p>
        )}
      </div>

      {accessToken ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            placeholder={strings.postDetail.commentPlaceholder}
            className="flex-1 rounded-[10px] border border-border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none focus-visible:border-accent-primary"
          />
          <Button type="submit" disabled={submitting || !text.trim()}>
            {strings.postDetail.submit}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-text-secondary">{strings.postDetail.loginToComment}</p>
      )}

      {error && <p className="text-sm text-accent-danger">{error}</p>}
    </main>
  );
}
