/**
 * Console error logging for the API.
 * Expected client failures (4xx) stay quiet; unexpected / server failures print.
 * Swap the console body later for email or another sink without touching routes.
 */

function resolveStatus(err, status) {
  if (Number.isInteger(status)) return status;
  if (Number.isInteger(err?.status)) return err.status;
  return 500;
}

/** True when this failure should be recorded (server / unexpected). */
export function shouldLogError(err, status) {
  return resolveStatus(err, status) >= 500;
}

/**
 * @param {string} context short label, e.g. "trades.post"
 * @param {unknown} err
 * @param {{ status?: number }} [opts]
 */
export function logError(context, err, opts = {}) {
  if (!shouldLogError(err, opts.status)) return;

  const label = context ? `[${context}]` : "[error]";
  if (err instanceof Error) {
    console.error(label, err.stack || err.message);
    return;
  }
  console.error(label, err);
}

/**
 * Log unexpected failures, then send the usual `{ error }` JSON body.
 * @param {import("express").Response} res
 * @param {unknown} err
 * @param {string} context
 */
export function sendRouteError(res, err, context) {
  const status =
    err && typeof err === "object" && Number.isInteger(err.status) ? err.status : 500;
  logError(context, err, { status });
  const message =
    err && typeof err === "object" && typeof err.message === "string"
      ? err.message
      : "Internal server error";
  res.status(status).json({ error: message });
}
