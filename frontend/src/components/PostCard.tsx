"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  Post,
  avatarUrl,
  blockHandle,
  followHandle,
  reportContent,
  toggleLike,
  unfollowHandle,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { Button } from "./Button";
import { CheckIcon, CommentIcon, HeartIcon, MoreIcon } from "./Icons";

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

// No location/identity line here, ever (F2.4/F3.1) - handle + avatar only.
export function PostCard({
  post,
  onHidden,
}: {
  post: Post;
  // Called when the viewer blocks this post's author, so the feed can drop
  // it from view immediately without waiting for a reload.
  onHidden?: () => void;
}) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [following, setFollowing] = useState(post.following);
  const [busy, setBusy] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function requireLogin() {
    router.push("/login");
  }

  async function onLike() {
    if (!accessToken) return requireLogin();
    setBusy(true);
    try {
      const result = await toggleLike(accessToken, post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Non-fatal - the like button just doesn't update.
    } finally {
      setBusy(false);
    }
  }

  async function onFollow() {
    if (!accessToken) return requireLogin();
    setBusy(true);
    try {
      if (following) {
        await unfollowHandle(accessToken, post.handle);
      } else {
        await followHandle(accessToken, post.handle);
      }
      setFollowing(!following);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.followError, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitReport(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !reportReason.trim()) return;
    try {
      await reportContent(accessToken, "post", post.id, reportReason.trim());
      showToast(strings.postCard.reportSent);
      setReporting(false);
      setReportReason("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.reportError, "error");
    }
  }

  async function onConfirmBlock() {
    if (!accessToken) return requireLogin();
    try {
      await blockHandle(accessToken, post.handle);
      onHidden?.();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.blockError, "error");
      setConfirmingBlock(false);
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <div className="brand-gradient shrink-0 rounded-full p-[1.5px]">
          <div className="rounded-full bg-bg-surface p-[1.5px]">
            <Image
              src={avatarUrl(post.avatarSeed)}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="rounded-full"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[13.5px] font-semibold">{post.handle}</div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-faint">
            <span className="inline-flex items-center gap-1 font-medium text-accent-success">
              <CheckIcon className="h-2.5 w-2.5" />
              {strings.postCard.cartoonizedBadge}
            </span>
            · {timeAgo(post.createdAt)}
          </div>
        </div>
        {!post.isOwnPost && (
          <button
            onClick={onFollow}
            disabled={busy}
            className="shrink-0 cursor-pointer text-xs font-semibold text-accent-primary-text disabled:opacity-50"
          >
            {following ? strings.postCard.following : strings.postCard.follow}
          </button>
        )}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={strings.postCard.moreActions}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-faint hover:bg-bg-base hover:text-text-primary"
          >
            <MoreIcon className="h-[18px] w-[18px]" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-9 right-0 z-10 flex w-40 flex-col overflow-hidden rounded-[10px] border border-border bg-bg-elevated py-1 shadow-[var(--shadow-card)]"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  if (accessToken) setReporting((v) => !v);
                  else requireLogin();
                }}
                className="cursor-pointer px-3.5 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-base"
              >
                {strings.postCard.report}
              </button>
              {!post.isOwnPost && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (accessToken) setConfirmingBlock(true);
                    else requireLogin();
                  }}
                  className="cursor-pointer px-3.5 py-2 text-left text-[13px] font-medium text-accent-danger hover:bg-bg-base"
                >
                  {strings.postCard.block}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {post.imageUrl && (
        <Link href={`/post/${post.id}`} className="block aspect-square overflow-hidden rounded-[16px] bg-bg-base">
          <Image
            src={post.imageUrl}
            alt={strings.postCard.imageAlt}
            width={600}
            height={600}
            unoptimized
            className="h-full w-full object-cover"
          />
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={onLike}
          disabled={busy}
          aria-pressed={liked}
          aria-label={liked ? strings.postCard.liked : strings.postCard.like}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out hover:bg-bg-base active:scale-90 disabled:opacity-50 ${
            liked ? "text-accent-secondary" : "text-text-primary"
          }`}
        >
          <HeartIcon className="h-[22px] w-[22px]" fill={liked ? "currentColor" : "none"} />
        </button>
        <Link
          href={`/post/${post.id}`}
          aria-label={strings.postCard.comments}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary hover:bg-bg-base"
        >
          <CommentIcon className="h-[22px] w-[22px]" />
        </Link>
      </div>

      {likeCount > 0 && <div className="text-[13.5px] font-bold">{likeCount} {strings.postCard.likesLabel}</div>}

      {post.caption && (
        <p className="text-[13.8px] leading-relaxed text-text-primary">
          <span className="mr-1.5 font-mono font-semibold">{post.handle}</span>
          {post.caption}
        </p>
      )}

      {post.commentCount > 0 && (
        <Link href={`/post/${post.id}`} className="text-[13px] text-text-faint hover:text-text-secondary">
          {strings.postCard.viewComments(post.commentCount)}
        </Link>
      )}

      <div className="text-[11px] tracking-wide text-text-faint uppercase">{timeAgo(post.createdAt)}</div>

      {reporting && (
        <form onSubmit={onSubmitReport} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <label htmlFor={`report-${post.id}`} className="text-xs font-medium text-text-primary">
            {strings.postCard.reportPrompt}
          </label>
          <textarea
            id={`report-${post.id}`}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={strings.postCard.reportPlaceholder}
            rows={2}
            maxLength={500}
            autoFocus
            className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent-primary"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!reportReason.trim()}>
              {strings.postCard.reportSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReporting(false);
                setReportReason("");
              }}
            >
              {strings.common.cancel}
            </Button>
          </div>
        </form>
      )}

      {confirmingBlock && (
        <div className="flex flex-col gap-2 rounded-lg border border-accent-danger p-3">
          <p className="text-sm text-text-primary">{strings.postCard.blockConfirm(post.handle)}</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={onConfirmBlock}>
              {strings.postCard.blockConfirmYes}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingBlock(false)}>
              {strings.common.cancel}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
