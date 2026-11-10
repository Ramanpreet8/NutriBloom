const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'http://localhost:3000').replace(/\/+$/, '');

export const apiUrl = (path: string) =>
  `${API_URL}/${path.replace(/^\/+/, '')}`;
