import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' || !mongoose.isObjectIdOrHexString(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 400 });
  }
  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }
  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && mongoose.isObjectIdOrHexString(member))
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }
  const memberIds = [...new Set(members.map((member: string) => member.toLowerCase()))];
  if (await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw Object.assign(new Error('Team member not found'), { status: 400 });
  }
  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    { $lookup: { from: Activity.collection.name, let: { teamId: '$_id' }, pipeline: [
      { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
      { $group: { _id: null, totalPoints: { $sum: '$points' } } },
    ], as: 'activities' } },
    { $project: { teamName: '$name', totalPoints: { $ifNull: [{ $arrayElemAt: ['$activities.totalPoints', 0] }, 0] } } },
    { $sort: { totalPoints: -1, teamName: 1, _id: 1 } },
  ]);
  return teams.map(({ teamName, totalPoints }, index) => ({ teamName, totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).limit(20).lean(),
    Workout.find().sort({ title: 1, _id: 1 }).lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const goalMatches = workouts.filter((workout) => workout.focus.toLowerCase() === goal);
  if (goalMatches.length) {
    return goalMatches.map((workout) => ({ ...workout, reason: `Matches your ${user.fitnessGoal} fitness goal.` }));
  }

  const activityFocus: Record<string, string> = { run: 'endurance', cycle: 'endurance', walk: 'endurance' };
  for (const activity of activities) {
    const type = activity.type.toLowerCase();
    const focus = activityFocus[type] ?? type;
    const matches = workouts.filter((workout) => workout.focus.toLowerCase() === focus);
    if (matches.length) {
      return matches.map((workout) => ({ ...workout, reason: `Based on your recent ${activity.type} activity.` }));
    }
  }
  return [];
}

export { User };
