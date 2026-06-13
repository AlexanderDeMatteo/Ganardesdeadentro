export type BiologicalSex = 'male' | 'female';

export interface BodyProfile {
  heightCm?: number;
  age?: number;
  sex?: BiologicalSex;
}

export interface BodyProfileResponse {
  bodyProfile: BodyProfile;
}
