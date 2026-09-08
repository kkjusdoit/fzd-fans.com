/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

// Define simple interface for Cloudflare Env
interface Env {
  DB: import("@cloudflare/workers-types").D1Database;
  R2?: import("@cloudflare/workers-types").R2Bucket;
  AUTH_CODE?: string;
  MESSAGE_REVIEW_REQUIRED?: string;
}

declare namespace App {
  interface Locals extends import("@astrojs/cloudflare").Runtime<Env> {}
}
