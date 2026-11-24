import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Activity, Team, User } from '../src/models/index.js';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('activity creation', () => {
  it('rejects invalid activity fields without writing records', async () => {
    const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
    const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' });
    const valid = { userId: user._id.toString(), teamId: team._id.toString(), type: 'run', minutes: 30 };

    for (const invalid of [{ type: ' ' }, { type: 42 }, { minutes: 0 }, { minutes: -1 }, { minutes: '30' }, { minutes: null }]) {
      const response = await request(createApp()).post('/api/activities').send({ ...valid, ...invalid });
      expect(response.status).toBe(400);
    }
    expect(await Activity.countDocuments()).toBe(0);
  });
});
