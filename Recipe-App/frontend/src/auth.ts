const API_URL = 'http://localhost:5000/api';

export interface AuthResponse {
  success: boolean;
  uid?: string;
  error?: string;
}

export const authService = {
  signup: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
};