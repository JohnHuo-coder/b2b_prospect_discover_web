import { waitUntil } from "@vercel/functions";
import { after } from "next/server";

type AfterTask = () => void | Promise<void>;

/** Schedule work to continue after the HTTP response (Vercel waitUntil when available). */
export function runAfterResponse(task: AfterTask) {
  const promise = Promise.resolve().then(task);

  promise.catch((error) => {
    console.error("[runAfterResponse] background task failed", error);
  });

  if (process.env.VERCEL === "1") {
    waitUntil(promise);
    return;
  }

  try {
    after(() => promise);
  } catch {
    void promise;
  }
}
