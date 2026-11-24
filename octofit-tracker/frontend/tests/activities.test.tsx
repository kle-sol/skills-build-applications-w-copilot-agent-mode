import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Activities from '../src/components/Activities.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('displays activity minutes and points from the shared API request', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    activities: [{ _id: 'activity-1', type: 'run', minutes: 30, points: 45 }],
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<Activities />);
  expect(await screen.findByText(/run: 30 minutes, 45 points/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/activities$/));
});

it('reports an invalid activities response as an error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  render(<Activities />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load activities/i);
});
