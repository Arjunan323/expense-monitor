// Thin wrapper that will import generated types & client once generated.
// Regeneration command (placeholder): npm run generate:api
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// After generation we can re-export useful pieces here.
