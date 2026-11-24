import { getJson } from '../api/client.js';
import { useApiList } from '../api/useApiList.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

async function loadTeams() {
  const { teams } = await getJson<{ teams: Team[] }>('/api/teams');
  return teams;
}

export default function Teams() {
  const state = useApiList(loadTeams);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">Unable to load teams.</p>}
        {state.status === 'success' && (
          state.items.length === 0
            ? <p>No teams yet.</p>
            : <ul>{state.items.map((team, index) => (
              <li key={team._id ?? index}>{team.name}{team.mascot && ` - ${team.mascot}`}: {team.members.length} members</li>
            ))}</ul>
        )}
      </div>
    </section>
  );
}
