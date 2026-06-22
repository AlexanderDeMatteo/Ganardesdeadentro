import type { MuscleGroup } from '@/lib/api/contracts/biomechanics';

export interface MuscleMeta {
  label: string;
  svgRegions: string[];
  meshName: string;
}

export const MUSCLE_MAP: Record<MuscleGroup, MuscleMeta> = {
  gluteos: { label: 'Glúteos', svgRegions: ['back-gluteos'], meshName: 'mesh_gluteos' },
  isquiosurales: { label: 'Isquiosurales', svgRegions: ['back-isquios'], meshName: 'mesh_isquiosurales' },
  cuadriceps: { label: 'Cuádriceps', svgRegions: ['front-cuadriceps'], meshName: 'mesh_cuadriceps' },
  erectores: { label: 'Erectores espinales', svgRegions: ['back-erectores'], meshName: 'mesh_erectores' },
  dorsales: { label: 'Dorsales', svgRegions: ['back-dorsales'], meshName: 'mesh_dorsales' },
  abdominales: { label: 'Abdominales', svgRegions: ['front-abdominales'], meshName: 'mesh_abdominales' },
  pectoral: { label: 'Pectoral', svgRegions: ['front-pectoral'], meshName: 'mesh_pectoral' },
  deltoides: { label: 'Deltoides', svgRegions: ['front-deltoides', 'back-deltoides'], meshName: 'mesh_deltoides' },
  biceps: { label: 'Bíceps', svgRegions: ['front-biceps'], meshName: 'mesh_biceps' },
  triceps: { label: 'Tríceps', svgRegions: ['back-triceps'], meshName: 'mesh_triceps' },
  gemelos: { label: 'Gemelos', svgRegions: ['back-gemelos'], meshName: 'mesh_gemelos' },
  trapecio: { label: 'Trapecio', svgRegions: ['back-trapecio'], meshName: 'mesh_trapecio' },
};

export const ACTIVE_COLOR = '#e23b3b';
export const BASE_COLOR = '#3a4a40';
export const ANTAGONIST_FACTOR = 0.25;

export function muscleLabel(group: MuscleGroup): string {
  return MUSCLE_MAP[group]?.label ?? group;
}
