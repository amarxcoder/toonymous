// PM2 process config (root CLAUDE.md deploy convention: bare VPS, PM2, nginx).
// Each app runs its own `npm run build` first, then PM2 runs the built output.
// Ports come from this project's assigned block, 3080-3089
// (specs/04-conventions.md): 3080 frontend, 3081 backend API, 3082 cartoonizer
// (internal-only, not proxied by nginx).
module.exports = {
  apps: [
    {
      name: "toonymous-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run start -- -p 3080",
      env: { NODE_ENV: "production", PORT: "3080" },
    },
    {
      name: "toonymous-backend",
      cwd: "./backend",
      script: "dist/index.js",
      env: { NODE_ENV: "production", PORT: "3081" },
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
      env: { NODE_ENV: "production", PORT: "3082" },
    },
  ],
};
