import crypto from "crypto";

// System-generated handles only (F2.2) - no free-text custom handle input
// anywhere in the API. Word lists are deliberately generic (no place names,
// no demonyms) so a handle can never leak identity or location.
const ADJECTIVES = [
  "quiet", "amber", "swift", "gentle", "brisk", "mellow", "curious", "bold",
  "hazy", "vivid", "quirky", "calm", "sunny", "sly", "nimble", "cozy",
  "eager", "plucky", "wry", "breezy",
];

const NOUNS = [
  "otter", "sparrow", "maple", "comet", "lantern", "pebble", "willow",
  "falcon", "cinder", "harbor", "meadow", "ember", "thistle", "heron",
  "boulder", "juniper", "sable", "canyon", "drizzle", "quartz",
];

function randomInt(max: number): number {
  return crypto.randomInt(0, max);
}

export function generateHandle(): string {
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const noun = NOUNS[randomInt(NOUNS.length)];
  const suffix = crypto.randomInt(100, 999);
  return `${adjective}-${noun}-${suffix}`;
}
