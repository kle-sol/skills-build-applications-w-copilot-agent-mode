import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Leaderboard from '../src/components/Leaderboard.js';
import Teams from '../src/components/Teams.js';
import Workouts from '../src/components/Workouts.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('capability views', () => {
  it('displays team mascot and membership count', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      teams: [{ _id: 'team-1', name: 'Octocats', mascot: 'Mona', members: ['user-1', 'user-2'] }],
    }), { status: 200 })));
    render(<Teams />);
    expect(await screen.findByText(/Octocats - Mona: 2 members/)).toBeInTheDocument();
  });

  it('displays leaderboard rank and points', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      leaderboard: [{ teamName: 'Octocats', totalPoints: 90, rank: 1 }],
    }), { status: 200 })));
    render(<Leaderboard />);
    expect(await screen.findByText(/Rank 1: Octocats - 90 points/)).toBeInTheDocument();
  });

  it('displays workout details and explains the seeded user', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      suggestions: [{ title: 'Intervals', reason: 'Build endurance', focus: 'endurance', minutes: 30, difficulty: 'moderate' }],
    }), { status: 200 })));
    render(<Workouts />);
    expect(screen.getByText(/suggestions for mona@example.com/i)).toBeInTheDocument();
    expect(await screen.findByText(/Build endurance - endurance, 30 minutes, moderate/)).toBeInTheDocument();
  });

  it.each([Teams, Leaderboard, Workouts])('reports malformed list responses as errors', async (Component) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    render(<Component />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load/i);
  });
});
