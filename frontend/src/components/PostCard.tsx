"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  Post,
  blockHandle,
  followHandle,
  reportContent,
  toggleLike,
  unfollowHandle,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { timeAgo } from "@/lib/time";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { IconButton } from "./IconButton";
import { AlertIcon, CheckIcon, CommentIcon, HeartIcon, MoreIcon, TrashIcon } from "./Icons";
import { Menu, MenuItem } from "./Menu";
import { PostImage } from "./PostImage";
import { Sheet } from "./Sheet";
import { TextArea } from "./TextField";

// No location/identity line here, ever (F2.4/F3.1) - handle + avatar only.
export function PostCard({
  post,
  priority = false,
  showCommentsLink = true,
  onHidden,
}: {
  post: Post;
  /* The first card in a feed loads its image eagerly so the top of the page
     is complete as soon as possible. */
  priority?: boolean;
  /* False on the post detail screen, where a "view all comments" link would
     point at the page the reader is already on. */
  showCommentsLink?: boolean;
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
  const [followBusy, setFollowBusy] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Drives the one-shot tap animation on the heart; cleared when it ends so
  // the same class can be re-applied on the next tap.
  const [likeAnimating, setLikeAnimating] = useState(false);
  // Guards against a second toggle being sent while the first is in flight,
  // without visually disabling the button (the optimistic state already
  // answered the tap).
  const likeInFlight = useRef(false);
  // Both the report sheet and the block dialog are opened from a menu item
  // that unmounts with its menu, so focus is handed back here instead.
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  function requireLogin() {
    router.push("/login");
  }

  async function onLike() {
    if (!accessToken) return requireLogin();
    if (likeInFlight.current) return;
    likeInFlight.current = true;

    // Optimistic: the heart responds on the same frame as the tap, and the
    // server response below reconciles the real count.
    const previous = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    if (!liked) setLikeAnimating(true);

    try {
      const result = await toggleLike(accessToken, post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Roll back to what the server last told us rather than leaving a like
      // that did not actually land.
      setLiked(previous.liked);
      setLikeCount(previous.likeCount);
    } finally {
      likeInFlight.current = false;
    }
  }

  async function onFollow() {
    if (!accessToken) return requireLogin();
    setFollowBusy(true);
    try {
      if (following) {
        await unfollowHandle(accessToken, post.handle);
        showToast(strings.postCard.unfollowed);
      } else {
        await followHandle(accessToken, post.handle);
        showToast(strings.postCard.followed, "success");
      }
      setFollowing(!following);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.followError, "error");
    } finally {
      setFollowBusy(false);
    }
  }

  async function onSubmitReport(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !reportReason.trim()) return;
    setReportBusy(true);
    try {
      await reportContent(accessToken, "post", post.id, reportReason.trim());
      showToast(strings.postCard.reportSent, "success");
      setReporting(false);
      setReportReason("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.reportError, "error");
    } finally {
      setReportBusy(false);
    }
  }

  async function onConfirmBlock() {
    if (!accessToken) return requireLogin();
    try {
      await blockHandle(accessToken, post.handle);
      // Closed before onHidden, which may unmount this card entirely.
      setConfirmingBlock(false);
      showToast(strings.postCard.blockedToast, "success");
      onHidden?.();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.postCard.blockError, "error");
      setConfirmingBlock(false);
    }
  }

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface p-4 shadow-card transition-shadow duration-[var(--dur)] ease-out hover:shadow-pop">
      <div className="flex items-center gap-2.5">
        <Avatar seed={post.avatarSeed} size={36} ring />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[13.5px] font-semibold">{post.handle}</div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-faint">
            {/* Always literally true for anything reaching the feed, which is
                the only reason a permanent trust badge is safe here. */}
            <span className="inline-flex items-center gap-1 rounded-pill bg-accent-success/10 px-1.5 py-0.5 font-medium text-accent-success">
              <CheckIcon className="h-2.5 w-2.5" />
              {strings.postCard.cartoonizedBadge}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          </div>
        </div>
        {!post.isOwnPost && (
          <button
            onClick={onFollow}
            disabled={followBusy}
            className={`shrink-0 cursor-pointer rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-[var(--dur-fast)] ease-out active:scale-95 disabled:opacity-50 ${
              following
                ? "border border-border text-text-secondary hover:border-border-strong hover:text-text-primary"
                : "border border-transparent bg-accent-primary/10 text-accent-primary-text hover:bg-accent-primary/16"
            }`}
          >
            {following ? strings.postCard.following : strings.postCard.follow}
          </button>
        )}
        <div className="relative shrink-0">
          <IconButton
            ref={moreButtonRef}
            label={strings.postCard.moreActions}
            size="sm"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreIcon className="h-[18px] w-[18px]" />
          </IconButton>
          <Menu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label={strings.postCard.moreActions}
          >
            <MenuItem
              icon={<AlertIcon className="h-4 w-4" />}
              onClick={() => {
                setMenuOpen(false);
                if (accessToken) setReporting(true);
                else requireLogin();
              }}
            >
              {strings.postCard.report}
            </MenuItem>
            {!post.isOwnPost && (
              <MenuItem
                destructive
                icon={<TrashIcon className="h-4 w-4" />}
                onClick={() => {
                  setMenuOpen(false);
                  if (accessToken) setConfirmingBlock(true);
                  else requireLogin();
                }}
              >
                {strings.postCard.block}
              </MenuItem>
            )}
          </Menu>
        </div>
      </div>

      <Link
        href={`/post/${post.id}`}
        className="block overflow-hidden rounded-xl"
        aria-label={strings.postDetail.title}
      >
        <PostImage src={post.imageUrl} priority={priority} />
      </Link>

      <div className="flex items-center gap-1">
        <IconButton
          label={liked ? strings.postCard.liked : strings.postCard.like}
          aria-pressed={liked}
          onClick={onLike}
          size="sm"
          tone={liked ? "like" : "strong"}
        >
          <HeartIcon
            className={`h-[22px] w-[22px] ${likeAnimating ? "animate-like-pop" : ""}`}
            fill={liked ? "currentColor" : "none"}
            onAnimationEnd={() => setLikeAnimating(false)}
          />
        </IconButton>
        <Link
          href={`/post/${post.id}`}
          aria-label={strings.postCard.comments}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-primary transition-all duration-[var(--dur-fast)] ease-out hover:bg-bg-subtle active:scale-90"
        >
          <CommentIcon className="h-[22px] w-[22px]" />
        </Link>
      </div>

      {likeCount > 0 && (
        <div className="text-[13.5px] font-bold tabular-nums">
          {likeCount} {strings.postCard.likesLabel}
        </div>
      )}

      {post.caption && (
        <p className="text-[13.8px] leading-relaxed break-words text-text-primary">
          <span className="mr-1.5 font-mono font-semibold">{post.handle}</span>
          {post.caption}
        </p>
      )}

      {showCommentsLink && post.commentCount > 0 && (
        <Link
          href={`/post/${post.id}`}
          className="w-fit text-[13px] text-text-faint transition-colors duration-[var(--dur-fast)] ease-out hover:text-text-primary"
        >
          {strings.postCard.viewComments(post.commentCount)}
        </Link>
      )}

      <Sheet
        open={reporting}
        onClose={() => {
          setReporting(false);
          setReportReason("");
        }}
        title={strings.postCard.reportTitle}
        returnFocusRef={moreButtonRef}
      >
        <form id={`report-form-${post.id}`} onSubmit={onSubmitReport} className="pb-2">
          <TextArea
            id={`report-${post.id}`}
            label={strings.postCard.reportPrompt}
            placeholder={strings.postCard.reportPlaceholder}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCounter
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
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
            <Button type="submit" disabled={!reportReason.trim()} loading={reportBusy}>
              {strings.postCard.reportSubmit}
            </Button>
          </div>
        </form>
      </Sheet>

      <ConfirmDialog
        open={confirmingBlock}
        onClose={() => setConfirmingBlock(false)}
        onConfirm={onConfirmBlock}
        title={strings.postCard.blockConfirmTitle}
        description={strings.postCard.blockConfirm(post.handle)}
        confirmLabel={strings.postCard.blockConfirmYes}
        destructive
        returnFocusRef={moreButtonRef}
      />
    </article>
  );
}
