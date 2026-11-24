import { getJson } from '../api/client.js';
import { useApiList } from '../api/useApiList.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

async function loadActivities() {
  const { activities } = await getJson<{ activities: Activity[] }>('/api/activities');
  return activities;
}

export default function Activities() {
  const state = useApiList(loadActivities);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {state.status === 'loading' && <p role="status">Loading activities...</p>}
        {state.status === 'error' && <p role="alert">Unable to load activities.</p>}
        {state.status === 'success' && (
          state.items.length === 0
            ? <p>No activities yet.</p>
            : <ul>{state.items.map((activity, index) => (
              <li key={activity._id ?? index}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>
            ))}</ul>
        )}
      </div>
    </section>
  );
}
