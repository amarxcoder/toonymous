"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, Post, getFeed } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { LockIcon, PlusSquareIcon } from "@/components/Icons";
import { PostCard } from "@/components/PostCard";
import { RightRail } from "@/components/RightRail";

type Tab = "chronological" | "random";

export default function FeedPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("chronological");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(nextTab: Tab, reset: boolean) {
    setLoading(true);
    setError(null);
    try {
      const seenIds = reset ? "" : posts.map((p) => p.id).join(",");
      const param = nextTab === "random" ? seenIds : cursor ?? undefined;
      const result = await getFeed(
        nextTab,
        reset ? undefined : param || undefined,
        accessToken ?? undefined
      );
      setPosts((prev) => (reset ? result.posts : [...prev, ...result.posts]));
      setCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.feed.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    load(tab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-1 items-start justify-center gap-10 px-4 py-6 lg:py-8">
      <main className="flex w-full max-w-lg flex-1 flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{strings.feed.title}</h1>
          <Link href="/compose">
            <Button className="!px-3.5 !py-2 text-[13px]">
              <PlusSquareIcon className="h-4 w-4" />
              {strings.nav.post}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-5 border-b border-border">
          {(["chronological", "random"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative cursor-pointer pb-3 text-[14.5px] font-semibold transition-colors duration-150 ease-out ${
                tab === t ? "text-text-primary" : "text-text-faint hover:text-text-secondary"
              }`}
            >
              {t === "chronological" ? strings.feed.recent : strings.feed.shuffle}
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-text-primary" />
              )}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-1.5 pb-3 text-[11.5px] font-medium text-text-faint">
            <LockIcon className="h-3 w-3" />
            {strings.feed.noAlgorithm}
          </span>
        </div>

        {error && <p className="text-sm text-accent-danger">{error}</p>}

        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onHidden={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))}
        </div>

        {posts.length === 0 && !loading && !error && (
          <p className="py-12 text-center text-sm text-text-secondary">{strings.feed.empty}</p>
        )}

        {(cursor || tab === "random") && posts.length > 0 && (
          <Button variant="secondary" disabled={loading} onClick={() => load(tab, false)}>
            {loading ? strings.feed.loadMoreBusy : strings.feed.loadMore}
          </Button>
        )}
      </main>
      <RightRail />
    </div>
  );
}
