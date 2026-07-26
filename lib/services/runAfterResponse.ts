import { waitUntil } from "@vercel/functions";
import { after } from "next/server";

type AfterTask = () => void | Promise<void>;

/**
 * Run `task` without blocking the HTTP response to the browser.
 *
 * Timeline on Vercel:
 *   1. Route handler writes DB, calls runAfterResponse(n8n fetch), then return jsonResponse(...)
 *   2. Browser receives 200 immediately → modal closes
 *   3. waitUntil keeps the lambda alive briefly so the n8n POST can finish in the background
 *
 * This is separate from n8n's "Respond Immediately" setting (that only controls how fast
 * n8n replies once it receives our POST). We must not await n8n in the main handler or
 * Vercel can hit maxDuration (504) before the browser gets a response.
 */
export function runAfterResponse(task: AfterTask) {
  const promise = Promise.resolve().then(task);

  promise.catch((error) => {
    console.error("[runAfterResponse] background task failed", error);
  });

  if (process.env.VERCEL === "1") {
    // Vercel: extend invocation after response; does not delay the response itself.
    waitUntil(promise);
    return;
  }

  try {
    // Local dev: Next.js after() is the equivalent hook.
    after(() => promise);
  } catch {
    void promise;
  }
}
