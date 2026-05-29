const TITAN_FALLBACK_PHRASES = [
  'Hoy no se negocia: entrenas o te quedas mirando el espejo.',
  'Un rep más. Tu yo del futuro te lo agradece.',
  'La disciplina pesa menos que el arrepentimiento.',
  'No busques motivación; busca consistencia.',
  'El hierro no miente: o subes la barra o bajas la excusa.',
  'Sudor hoy, respeto mañana.',
  'Tu cuerpo aguanta más de lo que tu cabeza te dice.',
  'Ganar no es suerte; es repetir lo difícil hasta que sea normal.',
  'Cada serie cuenta. Cada comida también.',
  'No entrenas para estar cansado; entrenas para estar imparable.',
  'Si fuera fácil, todos lo harían. Tú no viniste a ser todos.',
  'Levántate, calienta y demuestra por qué estás aquí.',
  'La racha se construye hoy, no el lunes.',
  'Menos excusas, más acción. Eso es FitTrack.',
  'El dolor del esfuerzo se va; el orgullo se queda.',
  'Come con cabeza, entrena con hambre, descansa con inteligencia.',
] as const;

export function pickTitanFallbackPhrase(exclude?: string): string {
  const pool =
    exclude && TITAN_FALLBACK_PHRASES.length > 1
      ? TITAN_FALLBACK_PHRASES.filter((p) => p !== exclude)
      : [...TITAN_FALLBACK_PHRASES];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? TITAN_FALLBACK_PHRASES[0];
}
