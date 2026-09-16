"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, Comment, Post, createComment, getComments, getPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { timeAgo } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { AlertIcon, CommentIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { CommentSkeleton, PostCardSkeleton } from "@/components/Skeleton";
import { InlineInput } from "@/components/TextField";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
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
      showToast(strings.postDetail.commentSent, "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : strings.postDetail.commentError;
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !post) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
        <PageHeader title={strings.postDetail.title} back />
        <EmptyState
          icon={<AlertIcon className="h-6 w-6" />}
          title={strings.postDetail.errorTitle}
          body={error}
        />
      </main>
    );
  }

  if (loading || !post) {
    return (
      <main
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6"
        aria-busy="true"
        aria-label={strings.common.loading}
      >
        <PageHeader title={strings.postDetail.title} back />
        <PostCardSkeleton />
        <div className="flex flex-col gap-1">
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <PageHeader title={strings.postDetail.title} back />

      <PostCard post={post} priority showCommentsLink={false} />

      {/* Composer sits above the list so replying never means scrolling past
          every existing comment first. */}
      {accessToken ? (
        <form
          onSubmit={onSubmit}
          className="flex gap-2 rounded-pill border border-border bg-bg-surface p-1.5 pl-2 shadow-xs"
        >
          <InlineInput
            label={strings.postDetail.commentLabel}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            placeholder={strings.postDetail.commentPlaceholder}
            className="rounded-pill border-transparent bg-transparent hover:border-transparent focus:border-transparent focus:ring-0"
          />
          <Button type="submit" disabled={!text.trim()} loading={submitting}>
            {strings.postDetail.submit}
          </Button>
        </form>
      ) : (
        <p className="rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-secondary">
          {strings.postDetail.loginToComment}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-wide text-text-faint uppercase">
          {strings.postDetail.commentsTitle(comments.length)}
        </h2>

        {comments.length > 0 ? (
          <ul className="flex flex-col">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex animate-rise gap-3 border-b border-border py-3 last:border-b-0"
              >
                <Avatar seed={c.avatarSeed} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-mono text-[12.5px] font-semibold">
                      {c.handle}
                    </span>
                    <time dateTime={c.createdAt} className="text-[11.5px] text-text-faint">
                      {timeAgo(c.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed break-words text-text-primary">
                    {c.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CommentIcon className="h-6 w-6" />}
            title={strings.postDetail.noComments}
            body={strings.postDetail.noCommentsBody}
          />
        )}
      </section>

    </main>
  );
}
