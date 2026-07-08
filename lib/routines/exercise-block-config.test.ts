import { describe, expect, it } from 'vitest';
import {
  buildSeriesPullBlockConfig,
  buildSupersetBlockConfig,
  createDefaultRomRangeDrafts,
  createDefaultSeriesPullDraft,
  formatExerciseSummary,
  formatRomRangeLabel,
  romDraftToRange,
  validateSeriesPullDraft,
  validateSupersetDraft,
} from '@/lib/routines/exercise-block-config';
import type { RoutineExercise } from '@/lib/data/types';

describe('exercise-block-config', () => {
  it('normalizes fixed reps into rom range', () => {
    const ranges = createDefaultRomRangeDrafts();
    ranges[0] = { ...ranges[0], mode: 'fixed', repsFixed: 8 };
    const result = romDraftToRange(ranges[0]);
    expect(result.repsMin).toBe(8);
    expect(result.repsMax).toBe(8);
  });

  it('validates series pull reps bounds', () => {
    const draft = createDefaultSeriesPullDraft();
    draft.romRanges[0].repsMin = 4;
    const result = validateSeriesPullDraft(draft);
    expect(result.ok).toBe(false);
  });

  it('builds superset block config with finisher for progressive', () => {
    const config = buildSupersetBlockConfig(
      {
        steps: [
          { weightKg: '5', repsTarget: '20' },
          { weightKg: '10', repsTarget: '15' },
        ],
        finisherWeightKg: '5',
        finisherRepsTarget: '20',
        rest: 90,
        technique: '',
      },
      'progressive',
    );
    expect(config.steps).toHaveLength(2);
    expect(config.finisher?.repsTarget).toBe('20');
    expect(config.maxTransitionRestSec).toBe(30);
  });

  it('allows regressive superset without finisher', () => {
    const result = validateSupersetDraft(
      {
        steps: [
          { weightKg: '25', repsTarget: '5' },
          { weightKg: '15', repsTarget: '10' },
        ],
        finisherWeightKg: '',
        finisherRepsTarget: '',
        rest: 90,
        technique: '',
      },
      'regressive',
    );
    expect(result.ok).toBe(true);
    const config = buildSupersetBlockConfig(
      {
        steps: [
          { weightKg: '25', repsTarget: '5' },
          { weightKg: '15', repsTarget: '10' },
        ],
        finisherWeightKg: '',
        finisherRepsTarget: '',
        rest: 90,
        technique: '',
      },
      'regressive',
    );
    expect(config.finisher).toBeUndefined();
  });

  it('formats exercise summary for series pull', () => {
    const exercise: RoutineExercise = {
      exerciseId: '1',
      exerciseName: 'Curl',
      sets: 1,
      reps: 8,
      rest: 90,
      blockConfig: buildSeriesPullBlockConfig(createDefaultSeriesPullDraft()),
    };
    const summary = formatExerciseSummary(exercise, 'series_pull');
    expect(summary.primary).toContain('1 serie compuesta');
    expect(summary.primary).toContain('P1→P2');
  });

  it('formats rom range label for fixed and range modes', () => {
    expect(formatRomRangeLabel({ from: 'P1', to: 'P2', repsMin: 8, repsMax: 8 })).toContain('8 reps');
    expect(formatRomRangeLabel({ from: 'P1', to: 'P2', repsMin: 5, repsMax: 10 })).toContain('5–10');
  });
});
