/// <reference types="vite/client" />

/**
 * API Client Setup
 * Handles all backend API calls with proper URL configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Make authenticated API requests
 */
export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { token, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Failed: ${url}`, error);
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet(endpoint: string, token?: string) {
  return apiCall(endpoint, { method: 'GET', token });
}

/**
 * POST request
 */
export async function apiPost(endpoint: string, data?: any, token?: string) {
  return apiCall(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * PATCH request
 */
export async function apiPatch(endpoint: string, data?: any, token?: string) {
  return apiCall(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * DELETE request
 */
export async function apiDelete(endpoint: string, token?: string) {
  return apiCall(endpoint, {
    method: 'DELETE',
    token,
  });
}

/**
 * Upload file with image compression
 */
export async function apiUploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>,
  token?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`File Upload Failed: ${url}`, error);
    throw error;
  }
}

// Export API base URL for debugging
export { API_BASE_URL };
