import { getJson } from '../api/client.js';
import { useApiList } from '../api/useApiList.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

async function loadLeaderboard() {
  const { leaderboard } = await getJson<{ leaderboard: Entry[] }>('/api/leaderboard');
  return leaderboard;
}

export default function Leaderboard() {
  const state = useApiList(loadLeaderboard);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load leaderboard.</p>}
        {state.status === 'success' && (
          state.items.length === 0
            ? <p>No rankings yet.</p>
            : <ol>{state.items.map((entry) => (
              <li key={entry.rank}>Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points</li>
            ))}</ol>
        )}
      </div>
    </section>
  );
}
