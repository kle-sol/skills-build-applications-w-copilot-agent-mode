# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React Router and Bootstrap for the four capability views. Fetch through the shared API client and provide accessible loading, empty, error, and success states.
- Logic tier decision: Keep `/api/*` routes thin and put validation, queries, and business behavior in explicit service functions. Return deliberate 4xx responses for invalid input and missing resources.
- Data tier decision: Define required fields and appropriate value validation in the Mongoose models. Preserve idempotent demo upserts, existing user data, and reconciliation of moved demo users' team memberships.
- Activity tracking approach: Validate the submitted type, minutes, and user and team IDs, including reference existence. Store the IDs, use minutes as points, and record the creation time; return the created record and list persisted activities.
- Team management approach: Validate the name and mascot, preserve submitted member IDs, and create and list persisted teams with their members.
- Leaderboard approach: Sum activity points by team, sort totals descending, and return the team name, total points, and 1-based rank.
- Workout suggestions approach: Look up the user by email, return a 4xx for an unknown user, and select workouts matching the user's goal or recent activity. Include an explanatory reason; request suggestions for the seeded demo user from the frontend.

## Test plan

Run the focused checks in tier order, then both builds:

1. `npm run test:data --prefix octofit-tracker/backend` checks model validation and safe, idempotent seeding.
2. `npm run test:api --prefix octofit-tracker/backend` checks activity and team creation, leaderboard ranking, and personalized suggestions.
3. `npm test --prefix octofit-tracker/frontend` checks API-backed views and accessible loading, empty, and error states.
4. `npm run build --prefix octofit-tracker/backend` and `npm run build --prefix octofit-tracker/frontend` check TypeScript and the frontend production build.

### Baseline results

- Both test commands initially failed because Vitest was missing. `npm ci --prefix octofit-tracker/backend` and `npm ci --prefix octofit-tracker/frontend` succeeded.
- `npm test --prefix octofit-tracker/backend`: 1 passed, 8 failed. Four data tests show missing required-field validation; the seed test passes. Four API tests show unimplemented activity and team creation, an empty leaderboard, and non-personalized suggestions.
- `npm test --prefix octofit-tracker/frontend`: 15 failed. The placeholder screens do not yet render API data or the required loading, empty, and error states.
- After model validation changes, `npm run test:data --prefix octofit-tracker/backend` passed all 5 tests, including the seed preservation and idempotency test.
- `npm run build --prefix octofit-tracker/backend` passed.
- After logic-tier changes, `npm test --prefix octofit-tracker/backend` passed all 18 tests; the `contract-api` and `step3-api` grading checks also passed.
- The focused API command and frontend build above have not yet been run.
