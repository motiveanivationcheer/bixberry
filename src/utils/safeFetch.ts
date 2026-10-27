/**
 * Safe fetch utility that inspects HTTP status and Content-Type
 * headers to prevent "Unexpected token '<', <!doctype... is not valid JSON" crashes.
 */

export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  data: T | null;
  error: string | null;
  isHtml: boolean;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!isJson) {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<') || contentType.toLowerCase().includes('text/html');
      
      const errorDetail = isHtml
        ? `Endpoint ${url} returned HTML (${res.status} ${res.statusText || 'OK'}) instead of JSON. The server or gateway served a web page or redirect.`
        : `Endpoint ${url} returned non-JSON content-type "${contentType}" (${res.status} ${res.statusText || 'OK'}).`;

      return {
        ok: false,
        status: res.status || 500,
        statusText: res.statusText || (res.status === 200 ? 'OK' : 'Error'),
        contentType,
        data: null,
        error: errorDetail,
        isHtml
      };
    }

    try {
      const data = await res.json();
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        contentType,
        data,
        error: res.ok ? null : (data?.error || `HTTP ${res.status} ${res.statusText}`),
        isHtml: false
      };
    } catch (parseErr: any) {
      return {
        ok: false,
        status: res.status || 500,
        statusText: res.statusText || 'Parse Error',
        contentType,
        data: null,
        error: `Failed to parse JSON response from ${url}: ${parseErr?.message}`,
        isHtml: false
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      contentType: '',
      data: null,
      error: netErr?.message || `Network error connecting to ${url}`,
      isHtml: false
    };
  }
}
