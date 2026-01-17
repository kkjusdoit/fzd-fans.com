/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

// Define simple interface for Cloudflare Env
interface Env {
  DB: import("@cloudflare/workers-types").D1Database;
}

declare namespace App {
  interface Locals extends import("@astrojs/cloudflare").Runtime<Env> {}
}
