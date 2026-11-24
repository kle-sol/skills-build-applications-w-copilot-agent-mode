import { getJson } from '../api/client.js';
import { useApiList } from '../api/useApiList.js';

type Suggestion = { _id?: string; title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };
const userEmail = 'mona@example.com';

async function loadWorkouts() {
  const { suggestions } = await getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
  return suggestions;
}

export default function Workouts() {
  const state = useApiList(loadWorkouts);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Suggestions for {userEmail}, based on fitness goals and activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
        {state.status === 'success' && (
          state.items.length === 0
            ? <p>No workout suggestions yet.</p>
            : <ul>{state.items.map((suggestion, index) => (
              <li key={suggestion._id ?? index}>
                <strong>{suggestion.title}</strong>: {suggestion.reason}
                {suggestion.focus && ` - ${suggestion.focus}`}
                {suggestion.minutes !== undefined && `, ${suggestion.minutes} minutes`}
                {suggestion.difficulty && `, ${suggestion.difficulty}`}
              </li>
            ))}</ul>
        )}
      </div>
    </section>
  );
}
