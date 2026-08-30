/** Fetch wrapper: timeouts, JSON handling, and user-friendly error messages. */

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

const TIMEOUT_MS = 15000;

const FALLBACK_MESSAGE = "We couldn't complete the analysis right now. Please try again.";

export async function apiPost(endpoint, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new ApiError(FALLBACK_MESSAGE, res.status);
    }

    if (!res.ok) {
      throw new ApiError(data?.message || FALLBACK_MESSAGE, res.status);
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError('The analysis is taking too long. Please try again.', 408);
    }
    throw new ApiError("We couldn't reach the analysis service. Please check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet(endpoint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`/api${endpoint}`, { signal: controller.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.message || FALLBACK_MESSAGE, res.status);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') throw new ApiError(FALLBACK_MESSAGE, 408);
    throw new ApiError(FALLBACK_MESSAGE, 0);
  } finally {
    clearTimeout(timer);
  }
}
