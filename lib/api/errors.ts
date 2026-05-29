export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiNotImplementedError extends Error {
  constructor(endpoint: string) {
    super(`Endpoint no implementado en backend: ${endpoint}`);
    this.name = 'ApiNotImplementedError';
  }
}
