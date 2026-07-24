import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api-client';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: 'Status',
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('builds a query string, dropping empty params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [], total: 0 }));
    await api.listEmployees({ page: 2, department: 'Sales', search: '', country: undefined });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/employees?page=2&department=Sales',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('POSTs a salary update with a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));
    await api.updateSalary(7, { amountMinor: 100, effectiveOn: '2025-01-01', reason: 'Raise' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/employees/7/salary-revisions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ amountMinor: 100, reason: 'Raise' });
  });

  it('hits the right URLs for the read endpoints', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));
    await api.getEmployee(3);
    await api.getSummary();
    await api.getPayBreakdown();
    await api.getMeta();
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      '/api/employees/3',
      '/api/insights/summary',
      '/api/insights/pay',
      '/api/meta',
    ]);
  });

  it('throws ApiError with the server message on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Nope' }, { ok: false, status: 400 }));
    await expect(api.getMeta()).rejects.toMatchObject({ status: 400, message: 'Nope' });
  });

  it('falls back to statusText when the error body has no message', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, { ok: false, status: 500 }));
    await expect(api.getMeta()).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps a network failure as an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(api.getMeta()).rejects.toMatchObject({ status: 0 });
  });
});
