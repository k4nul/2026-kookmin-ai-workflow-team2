export type TimeoutController = {
  controller: AbortController;
  clear: () => void;
};

export function createAbortControllerWithTimeout(timeoutMs: number): TimeoutController {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    clear: () => clearTimeout(timeout)
  };
}
