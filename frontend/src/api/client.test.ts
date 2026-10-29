import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  const data = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => data.set(k, String(v)),
    removeItem: (k: string) => data.delete(k),
    clear: () => data.clear(),
  };
});

import { api, ApiError, setSessionExpiredHandler } from './client';

const respond = (status: number, body: unknown = { message: 'nope' }) =>
  vi.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) });

describe('API client session expiry', () => {
  const onExpired = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onExpired.mockReset();
    setSessionExpiredHandler(onExpired);
  });

  it.each([401, 403])('reports an expired session on %i from a protected endpoint', async (status) => {
    localStorage.setItem('pomopro_token', 'old-token');
    vi.stubGlobal('fetch', respond(status));

    const err = await api.auth.me().catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(status);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('does not expire the session for a rejected login attempt', async () => {
    localStorage.setItem('pomopro_token', 'some-token');
    vi.stubGlobal('fetch', respond(403));

    await api.auth.login({ email: 'a@b.c', password: 'x' }).catch(() => {});

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('does not expire a newer session when an old request is rejected', async () => {
    localStorage.setItem('pomopro_token', 'old-token');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      localStorage.setItem('pomopro_token', 'new-token');
      return { status: 401, ok: false, json: () => Promise.resolve({}) };
    }));

    await api.tasks.list().catch(() => {});

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('sends the stored token with every request', async () => {
    localStorage.setItem('pomopro_token', 'my-token');
    const fetchMock = respond(200, []);
    vi.stubGlobal('fetch', fetchMock);

    await api.tasks.list();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
  });
});
