import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({}), Workout.deleteMany({})]);
});

describe('logic tier edge cases', () => {
  it('rejects invalid team members and permits an empty team', async () => {
    for (const members of [['invalid-id'], [new mongoose.Types.ObjectId().toString()], 'invalid']) {
      const response = await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona', members });
      expect(response.status).toBe(400);
    }
    expect(await Team.countDocuments()).toBe(0);
    const response = await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona' });
    expect(response.status).toBe(201);
    expect(response.body.team.members).toEqual([]);
  });

  it('includes teams without activities and ranks ties deterministically', async () => {
    await Team.create([{ name: 'Robocats', mascot: 'Hubot' }, { name: 'Octocats', mascot: 'Mona' }]);
    const response = await request(app).get('/api/leaderboard');
    expect(response.status).toBe(200);
    expect(response.body.leaderboard).toEqual([
      { teamName: 'Octocats', totalPoints: 0, rank: 1 },
      { teamName: 'Robocats', totalPoints: 0, rank: 2 },
    ]);
  });

  it('uses recent activity when no workout matches the user goal', async () => {
    const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
    const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'mobility' });
    await Activity.create({ user: user._id, team: team._id, type: 'run', minutes: 20, points: 20, occurredAt: new Date() });
    await Workout.create({ title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' });
    const response = await request(app).get('/api/workouts/suggestions/mona%40example.com');
    expect(response.status).toBe(200);
    expect(response.body.suggestions[0]).toMatchObject({ title: 'Intervals', reason: expect.stringMatching(/run/i) });
  });

  it('returns no suggestions when neither goal nor activity matches', async () => {
    await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'mobility' });
    await Workout.create({ title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' });
    const response = await request(app).get('/api/workouts/suggestions/mona%40example.com');
    expect(response.status).toBe(200);
    expect(response.body.suggestions).toEqual([]);
  });
});
