// apiClient.ts

export const API_BASE_URL = 'http://10.132.53.119:8080';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
} 