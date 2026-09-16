const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export type UserRole = "user" | "moderator" | "complianceOfficer";

export interface Me {
  handle: string;
  avatarSeed: string;
  handleRerollsRemaining: number;
  createdAt: string;
  role: UserRole;
  followerCount: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const isFormData = rest.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(rest.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "something went wrong");
  }
  return data as T;
}

export function signup(email: string, password: string) {
  return request<{ accessToken: string; handle: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<{ accessToken: string; handle: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh() {
  return request<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function getMe(accessToken: string) {
  return request<Me>("/me", { accessToken });
}

export function rerollHandle(accessToken: string) {
  return request<{ handle: string; handleRerollsRemaining: number }>(
    "/me/handle/reroll",
    { method: "POST", accessToken }
  );
}

export function deleteAccount(accessToken: string) {
  return request<void>("/me", { method: "DELETE", accessToken });
}

export function avatarUrl(seed: string) {
  return `${API_URL}/avatar/${encodeURIComponent(seed)}.svg`;
}

export type PostStatus = "pending" | "ready" | "blocked" | "failed";

export interface Post {
  id: string;
  caption: string | null;
  status: PostStatus;
  imageUrl: string | null;
  createdAt: string;
  handle: string;
  avatarSeed: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  following: boolean;
  isOwnPost: boolean;
}

// Must match CARTOON_STYLES in backend/src/lib/queue.ts.
export const CARTOON_STYLES = ["anime", "sketch", "comic"] as const;
export type CartoonStyle = (typeof CARTOON_STYLES)[number];

export function createPost(accessToken: string, image: File, caption: string, style: CartoonStyle) {
  const body = new FormData();
  body.append("image", image);
  if (caption) body.append("caption", caption);
  body.append("style", style);
  return request<Post>("/posts", { method: "POST", accessToken, body });
}

export function getPost(id: string, accessToken?: string) {
  return request<Post>(`/posts/${id}`, { accessToken });
}

export function getFeed(
  tab: "chronological" | "random",
  cursorOrExclude?: string,
  accessToken?: string
) {
  const params = new URLSearchParams({ tab });
  if (tab === "chronological" && cursorOrExclude) params.set("cursor", cursorOrExclude);
  if (tab === "random" && cursorOrExclude) params.set("exclude", cursorOrExclude);
  return request<{ posts: Post[]; nextCursor: string | null }>(
    `/posts/feed?${params.toString()}`,
    { accessToken }
  );
}

export function toggleLike(accessToken: string, postId: string) {
  return request<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`, {
    method: "POST",
    accessToken,
  });
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  handle: string;
  avatarSeed: string;
}

export function getComments(postId: string, accessToken?: string) {
  return request<{ comments: Comment[]; nextCursor: string | null }>(
    `/posts/${postId}/comments`,
    { accessToken }
  );
}

export function createComment(accessToken: string, postId: string, text: string) {
  return request<Comment>(`/posts/${postId}/comments`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ text }),
  });
}

export function reportContent(
  accessToken: string,
  targetType: "post" | "comment",
  targetId: string,
  reason: string
) {
  return request<{ id: string; status: string }>("/reports", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ targetType, targetId, reason }),
  });
}

export function getBlockedHandles(accessToken: string) {
  return request<{ handles: string[] }>("/blocks", { accessToken });
}

export function blockHandle(accessToken: string, handle: string) {
  return request<void>("/blocks", { method: "POST", accessToken, body: JSON.stringify({ handle }) });
}

export function unblockHandle(accessToken: string, handle: string) {
  return request<void>(`/blocks/${encodeURIComponent(handle)}`, { method: "DELETE", accessToken });
}

export function followHandle(accessToken: string, handle: string) {
  return request<void>("/follows", { method: "POST", accessToken, body: JSON.stringify({ handle }) });
}

export function unfollowHandle(accessToken: string, handle: string) {
  return request<void>(`/follows/${encodeURIComponent(handle)}`, { method: "DELETE", accessToken });
}

export type ActionTargetType = "post" | "comment" | "account";
export type ModerationActionType =
  | "remove_content"
  | "shadow_limit"
  | "ban"
  | "no_action"
  | "reverse";

export interface ActionableModerationAction {
  id: string;
  action: ModerationActionType;
  targetType: ActionTargetType;
  note: string | null;
  createdAt: string;
  appeal: { id: string; status: "pending" | "approved" | "denied" } | null;
}

export function getActionableModerationActions(accessToken: string) {
  return request<{ actions: ActionableModerationAction[] }>("/appeals/actionable", { accessToken });
}

export function submitAppeal(accessToken: string, moderationActionId: string, reason: string) {
  return request<{ id: string; status: string }>("/appeals", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ moderationActionId, reason }),
  });
}

export interface ModerationReport {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
  reporterHandle: string;
  target:
    | { status: string; caption: string | null; imageUrl: string | null; authorHandle: string }
    | { removedAt: string | null; text: string; authorHandle: string }
    | null;
}

export function getReportsQueue(accessToken: string) {
  return request<{ reports: ModerationReport[] }>("/moderation/reports?status=open", { accessToken });
}

export function resolveReport(
  accessToken: string,
  reportId: string,
  action: "remove_content" | "shadow_limit" | "ban" | "no_action",
  note?: string
) {
  return request<{ id: string }>(`/moderation/reports/${reportId}/resolve`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ action, note }),
  });
}

export interface ModerationAppeal {
  id: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  userHandle: string;
  action: { id: string; action: ModerationActionType; targetType: ActionTargetType; note: string | null };
}

export function getAppealsQueue(accessToken: string) {
  return request<{ appeals: ModerationAppeal[] }>("/moderation/appeals", { accessToken });
}

export function resolveAppeal(accessToken: string, appealId: string, status: "approved" | "denied") {
  return request<void>(`/moderation/appeals/${appealId}/resolve`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export interface ComplianceFlag {
  id: string;
  postId: string | null;
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export function getComplianceFlags(accessToken: string) {
  return request<{ flags: ComplianceFlag[] }>("/compliance/flags", { accessToken });
}

export function reviewComplianceFlag(accessToken: string, flagId: string) {
  return request<void>(`/compliance/flags/${flagId}/review`, { method: "POST", accessToken });
}
