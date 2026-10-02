/** Cliente admin: usa cookie httpOnly (credentials: include). Sem localStorage de token. */

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
}
