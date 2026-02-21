const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Ein Fehler ist aufgetreten');
  }
  
  return data;
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Cookies mitsenden
  });

  // Bei 401 Token refresh versuchen
  if (response.status === 401 && !skipAuth) {
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Ursprüngliche Anfrage wiederholen
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });
      return handleResponse<T>(retryResponse);
    }
  }

  return handleResponse<T>(response);
}

// Convenience Methoden
export const apiGet = <T>(endpoint: string, options?: RequestOptions) =>
  api<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  api<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  api<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });

export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  api<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T>(endpoint: string, options?: RequestOptions) =>
  api<T>(endpoint, { ...options, method: 'DELETE' });
