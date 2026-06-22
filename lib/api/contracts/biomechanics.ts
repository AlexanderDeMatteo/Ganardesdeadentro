export type MuscleGroup =
  | 'gluteos'
  | 'isquiosurales'
  | 'cuadriceps'
  | 'erectores'
  | 'dorsales'
  | 'abdominales'
  | 'pectoral'
  | 'deltoides'
  | 'biceps'
  | 'triceps'
  | 'gemelos'
  | 'trapecio';

export type MuscleRole = 'agonista' | 'antagonista' | 'sinergista';

export interface ExercisePhase {
  nombre: string;
  rango: [number, number];
  agonistas: MuscleGroup[];
  antagonistas: MuscleGroup[];
  sinergistas: MuscleGroup[];
  intensidad: number;
}

export interface ExerciseBiomechanics {
  ejercicio: string;
  animacionId: string;
  fases: ExercisePhase[];
  modeloUrl?: string;
  clip?: string;
}
