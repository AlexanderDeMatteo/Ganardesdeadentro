import type { ExerciseBiomechanics } from '@/lib/api/contracts/biomechanics';

export const EXERCISE_DATASET: Record<string, ExerciseBiomechanics> = {
  deadlift_01: {
    ejercicio: 'Peso Muerto',
    animacionId: 'deadlift_01',
    modeloUrl: '/models/biomech-figure.glb',
    clip: 'Deadlift',
    fases: [
      {
        nombre: 'Concéntrica (subida)',
        rango: [0, 50],
        agonistas: ['gluteos', 'isquiosurales'],
        antagonistas: ['abdominales'],
        sinergistas: ['erectores', 'cuadriceps'],
        intensidad: 0.85,
      },
      {
        nombre: 'Excéntrica (bajada)',
        rango: [50, 100],
        agonistas: ['isquiosurales', 'erectores'],
        antagonistas: ['cuadriceps'],
        sinergistas: ['gluteos', 'dorsales'],
        intensidad: 0.6,
      },
    ],
  },
  squat_01: {
    ejercicio: 'Sentadilla',
    animacionId: 'squat_01',
    clip: 'Squat',
    fases: [
      {
        nombre: 'Excéntrica (bajada)',
        rango: [0, 50],
        agonistas: ['cuadriceps', 'gluteos'],
        antagonistas: ['isquiosurales'],
        sinergistas: ['erectores', 'abdominales'],
        intensidad: 0.7,
      },
      {
        nombre: 'Concéntrica (subida)',
        rango: [50, 100],
        agonistas: ['cuadriceps', 'gluteos'],
        antagonistas: ['isquiosurales'],
        sinergistas: ['erectores', 'gemelos'],
        intensidad: 0.9,
      },
    ],
  },
  bench_01: {
    ejercicio: 'Press de Banca',
    animacionId: 'bench_01',
    clip: 'BenchPress',
    fases: [
      {
        nombre: 'Excéntrica (bajada)',
        rango: [0, 50],
        agonistas: ['pectoral'],
        antagonistas: ['dorsales'],
        sinergistas: ['deltoides', 'triceps'],
        intensidad: 0.65,
      },
      {
        nombre: 'Concéntrica (empuje)',
        rango: [50, 100],
        agonistas: ['pectoral', 'triceps'],
        antagonistas: ['dorsales'],
        sinergistas: ['deltoides'],
        intensidad: 0.9,
      },
    ],
  },
};
