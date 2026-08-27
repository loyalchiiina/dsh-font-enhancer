// dsh-font-enhancer — host half.
// This is a client-only plugin: all behavior lives in lib/client.js.
// The host half only needs to be a valid Cordis module so the bundle loads.
export const name = "dsh-font-enhancer";
export const inject = [];

export function apply(ctx) {
  ctx.logger.info("dsh-font-enhancer: host half loaded (client-only plugin)");
}
