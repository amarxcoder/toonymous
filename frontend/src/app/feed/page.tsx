"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, Post, getFeed } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { AlertIcon, ClockIcon, ImageIcon, LockIcon, PlusSquareIcon, ShuffleIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/Skeleton";
import { RightRail } from "@/components/RightRail";
import { SegmentedTabs } from "@/components/SegmentedTabs";

type Tab = "chronological" | "random";

const TABS = [
  { value: "chronological" as const, label: strings.feed.recent, icon: <ClockIcon className="h-4 w-4" /> },
  { value: "random" as const, label: strings.feed.shuffle, icon: <ShuffleIcon className="h-4 w-4" /> },
];

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("chronological");

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 items-start justify-center gap-10 px-4 py-6 lg:py-8">
      <main className="flex w-full max-w-lg flex-1 flex-col gap-5">
        <PageHeader
          title={strings.feed.title}
          subtitle={strings.feed.subtitle}
          action={
            <Link href="/compose" className="hidden sm:block lg:hidden">
              <Button size="sm" icon={<PlusSquareIcon className="h-4 w-4" />}>
                {strings.nav.post}
              </Button>
            </Link>
          }
        />

        <SegmentedTabs
          options={TABS}
          value={tab}
          onChange={setTab}
          label={strings.feed.tabsLabel}
          trailing={
            <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-text-faint">
              <LockIcon className="h-3 w-3" />
              {strings.feed.noAlgorithm}
            </span>
          }
        />

        {/* Keyed on the tab so switching remounts the list with its own fresh
            loading state, instead of clearing the previous tab's posts from
            an effect. */}
        <FeedList key={tab} tab={tab} />
      </main>
      <RightRail />
    </div>
  );
}

function FeedList({ tab }: { tab: Tab }) {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getFeed(tab, undefined, accessToken ?? undefined);
        if (cancelled) return;
        setPosts(result.posts);
        setCursor(result.nextCursor);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : strings.feed.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Retry and load-more both run from a click, so they can set the busy
  // state up front the way the initial mount cannot.
  async function fetchPage(reset: boolean) {
    setLoading(true);
    setError(null);
    try {
      // The chronological feed pages by cursor; the random feed instead
      // sends back the ids already shown so the server can exclude them.
      const seen = tab === "random" ? posts.map((p) => p.id).join(",") : cursor ?? undefined;
      const param = reset ? undefined : seen || undefined;
      const result = await getFeed(tab, param, accessToken ?? undefined);
      setPosts((prev) => (reset ? result.posts : [...prev, ...result.posts]));
      setCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.feed.loadError);
    } finally {
      setLoading(false);
    }
  }

  // Distinguishes the first load of a tab (full-page skeletons) from paging
  // in more of a list that is already on screen (a spinner on the button).
  const initialLoading = loading && posts.length === 0;
  const canLoadMore = (cursor || tab === "random") && posts.length > 0;

  if (initialLoading) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-label={strings.feed.loadingLabel}>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <EmptyState
        icon={<AlertIcon className="h-6 w-6" />}
        title={strings.feed.errorTitle}
        body={error}
        action={
          <Button variant="secondary" size="sm" loading={loading} onClick={() => fetchPage(true)}>
            {strings.common.retry}
          </Button>
        }
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-6 w-6" />}
        title={strings.feed.emptyTitle}
        body={strings.feed.empty}
        action={
          <Link href="/compose">
            <Button size="sm" icon={<PlusSquareIcon className="h-4 w-4" />}>
              {strings.feed.emptyAction}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="stagger flex flex-col gap-5">
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            priority={i === 0}
            onHidden={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
          />
        ))}
      </div>

      {/* A failure while paging keeps the posts already on screen and
          reports it above the load-more button instead. */}
      {error && (
        <p role="alert" className="text-[13px] text-accent-danger">
          {error}
        </p>
      )}

      {canLoadMore ? (
        <Button
          variant="secondary"
          size="lg"
          loading={loading}
          onClick={() => fetchPage(false)}
          className="w-full"
        >
          {loading ? strings.feed.loadMoreBusy : strings.feed.loadMore}
        </Button>
      ) : (
        !loading && (
          <p className="pb-2 text-center text-[12.5px] text-text-faint">{strings.feed.endOfFeed}</p>
        )
      )}
    </>
  );
}
