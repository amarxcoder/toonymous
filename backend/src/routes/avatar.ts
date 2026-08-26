import { Router } from "express";
import { generateAvatarSvg } from "../lib/avatar";

export const avatarRouter = Router();

// Public, deterministic, unauthenticated - rendering an avatar from a seed
// exposes nothing about the account it belongs to.
avatarRouter.get("/:seed.svg", (req, res) => {
  const svg = generateAvatarSvg(req.params.seed);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(svg);
});
