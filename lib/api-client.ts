import { supabase } from './supabase';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
