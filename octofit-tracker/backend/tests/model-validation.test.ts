import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../src/models/index.js';

describe('model validation', () => {
  it('rejects whitespace-only user identity and goal fields', () => {
    const error = new User({ name: ' ', email: ' ', fitnessGoal: ' ' }).validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.email).toBeDefined();
    expect(error?.errors.fitnessGoal).toBeDefined();
  });

  it('rejects whitespace-only team names and mascots', () => {
    const error = new Team({ name: ' ', mascot: ' ' }).validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.mascot).toBeDefined();
  });

  it('rejects blank activity types and invalid minutes and points', () => {
    const error = new Activity({
      user: new mongoose.Types.ObjectId(),
      team: new mongoose.Types.ObjectId(),
      type: ' ',
      minutes: 0,
      points: -1,
      occurredAt: new Date(),
    }).validateSync();
    expect(error?.errors.type).toBeDefined();
    expect(error?.errors.minutes).toBeDefined();
    expect(error?.errors.points).toBeDefined();
  });

  it('rejects blank workout fields and invalid duration', () => {
    const error = new Workout({ title: ' ', focus: ' ', minutes: 0, difficulty: ' ' }).validateSync();
    expect(error?.errors.title).toBeDefined();
    expect(error?.errors.focus).toBeDefined();
    expect(error?.errors.minutes).toBeDefined();
    expect(error?.errors.difficulty).toBeDefined();
  });
});
