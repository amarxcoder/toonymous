// PM2 process config (root CLAUDE.md deploy convention: bare VPS, PM2, nginx).
// Each app runs its own `npm run build` first, then PM2 runs the built output.
// Ports come from this project's assigned block, 4000-4009
// (specs/04-conventions.md): 4000 frontend, 4001 backend API, 4002 cartoonizer
// (internal-only, not proxied by nginx).
module.exports = {
  apps: [
    {
      name: "toonymous-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run start -- -p 4000",
      env: { NODE_ENV: "production", PORT: "4000" },
    },
    {
      name: "toonymous-backend",
      cwd: "./backend",
      script: "dist/index.js",
      env: { NODE_ENV: "production", PORT: "4001" },
    },
    {
      name: "toonymous-worker",
      cwd: "./backend",
      script: "dist/worker.js",
      env: { NODE_ENV: "production" },
    },
    {
      name: "toonymous-cartoonizer",
      cwd: "./cartoonizer",
      script: "dist/index.js",
      env: { NODE_ENV: "production", PORT: "4002", CARTOONIZE_PROVIDER: "onnx" },
    },
  ],
};
