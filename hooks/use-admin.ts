'use client';

import { useState, useCallback, useEffect } from 'react';

export interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  joinDate: string;
  trainerId?: string;
  membershipLevel: 'basic' | 'premium' | 'pro';
  metrics?: {
    weight: number;
    bodyFat: number;
    muscleMass: number;
  };
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  specialization: string;
  athletes: number;
  rating: number;
  joinDate: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  equipment: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  duration: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    rest: number;
  }>;
  createdDate: string;
}

const MOCK_ATHLETES: AthleteProfile[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    age: 28,
    gender: 'M',
    weight: 85.5,
    height: 180,
    joinDate: '2024-01-15',
    trainerId: '1',
    membershipLevel: 'pro',
    metrics: { weight: 85.5, bodyFat: 18.5, muscleMass: 45 },
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@example.com',
    age: 25,
    gender: 'F',
    weight: 62.0,
    height: 165,
    joinDate: '2024-02-10',
    trainerId: '1',
    membershipLevel: 'premium',
    metrics: { weight: 62.0, bodyFat: 22, muscleMass: 28 },
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@example.com',
    age: 32,
    gender: 'M',
    weight: 92.0,
    height: 175,
    joinDate: '2024-03-05',
    trainerId: '2',
    membershipLevel: 'basic',
    metrics: { weight: 92.0, bodyFat: 25, muscleMass: 40 },
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana@example.com',
    age: 30,
    gender: 'F',
    weight: 68.5,
    height: 170,
    joinDate: '2024-01-20',
    trainerId: undefined,
    membershipLevel: 'premium',
    metrics: { weight: 68.5, bodyFat: 24, muscleMass: 32 },
  },
  {
    id: '5',
    name: 'Roberto Sánchez',
    email: 'roberto@example.com',
    age: 35,
    gender: 'M',
    weight: 88.0,
    height: 182,
    joinDate: '2024-02-28',
    trainerId: undefined,
    membershipLevel: 'pro',
    metrics: { weight: 88.0, bodyFat: 20, muscleMass: 48 },
  },
];

const MOCK_TRAINERS: Trainer[] = [
  {
    id: '1',
    name: 'Diego Rodríguez',
    email: 'diego@trainer.com',
    specialization: 'Fuerza y Musculatura',
    athletes: 2,
    rating: 4.8,
    joinDate: '2023-06-10',
  },
  {
    id: '2',
    name: 'Sandra López',
    email: 'sandra@trainer.com',
    specialization: 'Cardio y Resistencia',
    athletes: 1,
    rating: 4.6,
    joinDate: '2023-08-15',
  },
  {
    id: '3',
    name: 'Miguel Fernández',
    email: 'miguel@trainer.com',
    specialization: 'Pérdida de Peso',
    athletes: 0,
    rating: 4.9,
    joinDate: '2023-07-20',
  },
];

const MOCK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Sentadilla', targetMuscle: 'Piernas', difficulty: 'intermediate', equipment: 'Barra' },
  { id: '2', name: 'Press de Banca', targetMuscle: 'Pecho', difficulty: 'intermediate', equipment: 'Barra' },
  { id: '3', name: 'Peso Muerto', targetMuscle: 'Espalda', difficulty: 'expert', equipment: 'Barra' },
  { id: '4', name: 'Flexiones', targetMuscle: 'Pecho', difficulty: 'beginner', equipment: 'Ninguno' },
  { id: '5', name: 'Dominadas', targetMuscle: 'Espalda', difficulty: 'intermediate', equipment: 'Barra' },
  { id: '6', name: 'Press de Hombros', targetMuscle: 'Hombros', difficulty: 'intermediate', equipment: 'Mancuernas' },
  { id: '7', name: 'Curl de Bíceps', targetMuscle: 'Brazos', difficulty: 'beginner', equipment: 'Mancuernas' },
  { id: '8', name: 'Extensión de Tríceps', targetMuscle: 'Brazos', difficulty: 'beginner', equipment: 'Cuerda' },
];

const MOCK_ROUTINES: Routine[] = [
  {
    id: '1',
    name: 'Upper Body A',
    description: 'Entrenamiento de pecho y espalda',
    difficulty: 'intermediate',
    duration: 60,
    exercises: [
      { exerciseId: '2', exerciseName: 'Press de Banca', sets: 4, reps: 8, rest: 90 },
      { exerciseId: '5', exerciseName: 'Dominadas', sets: 4, reps: 8, rest: 60 },
      { exerciseId: '6', exerciseName: 'Press de Hombros', sets: 3, reps: 10, rest: 60 },
    ],
    createdDate: '2024-01-10',
  },
  {
    id: '2',
    name: 'Lower Body A',
    description: 'Entrenamiento de piernas intenso',
    difficulty: 'intermediate',
    duration: 50,
    exercises: [
      { exerciseId: '1', exerciseName: 'Sentadilla', sets: 4, reps: 8, rest: 90 },
      { exerciseId: '3', exerciseName: 'Peso Muerto', sets: 3, reps: 5, rest: 120 },
    ],
    createdDate: '2024-01-15',
  },
];

export function useAdmin() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>(MOCK_ATHLETES);
  const [trainers, setTrainers] = useState<Trainer[]>(MOCK_TRAINERS);
  const [exercises, setExercises] = useState<Exercise[]>(MOCK_EXERCISES);
  const [routines, setRoutines] = useState<Routine[]>(MOCK_ROUTINES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.athletes) setAthletes(data.athletes);
        if (data.routines) setRoutines(data.routines);
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }
  }, []);

  const saveData = useCallback((data: any) => {
    localStorage.setItem('admin_data', JSON.stringify(data));
  }, []);

  const getAthleteById = useCallback((id: string) => {
    return athletes.find(a => a.id === id);
  }, [athletes]);

  const getTrainerById = useCallback((id: string) => {
    return trainers.find(t => t.id === id);
  }, [trainers]);

  const assignTrainerToAthlete = useCallback((athleteId: string, trainerId: string) => {
    const updatedAthletes = athletes.map(a =>
      a.id === athleteId ? { ...a, trainerId } : a
    );
    setAthletes(updatedAthletes);
    
    const updatedTrainers = trainers.map(t => {
      if (t.id === trainerId) {
        return { ...t, athletes: t.athletes + 1 };
      }
      const oldTrainer = trainers.find(tr => tr.id === athletes.find(at => at.id === athleteId)?.trainerId);
      if (oldTrainer && t.id === oldTrainer.id && t.athletes > 0) {
        return { ...t, athletes: t.athletes - 1 };
      }
      return t;
    });
    setTrainers(updatedTrainers);

    saveData({ athletes: updatedAthletes, routines });
  }, [athletes, trainers, routines, saveData]);

  const createRoutine = useCallback((routine: Omit<Routine, 'id' | 'createdDate'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
    };
    const updatedRoutines = [...routines, newRoutine];
    setRoutines(updatedRoutines);
    saveData({ athletes, routines: updatedRoutines });
    return newRoutine;
  }, [athletes, routines, saveData]);

  const updateRoutine = useCallback((id: string, routine: Partial<Routine>) => {
    const updatedRoutines = routines.map(r =>
      r.id === id ? { ...r, ...routine } : r
    );
    setRoutines(updatedRoutines);
    saveData({ athletes, routines: updatedRoutines });
  }, [athletes, routines, saveData]);

  const deleteRoutine = useCallback((id: string) => {
    const updatedRoutines = routines.filter(r => r.id !== id);
    setRoutines(updatedRoutines);
    saveData({ athletes, routines: updatedRoutines });
  }, [athletes, routines, saveData]);

  return {
    athletes,
    trainers,
    exercises,
    routines,
    isLoading,
    getAthleteById,
    getTrainerById,
    assignTrainerToAthlete,
    createRoutine,
    updateRoutine,
    deleteRoutine,
  };
}
