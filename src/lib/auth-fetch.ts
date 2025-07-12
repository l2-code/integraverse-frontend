import { supabase } from './supabase';

// Store the original fetch
const originalFetch = global.fetch;

// Create a custom fetch that adds authorization headers
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  const bearerToken = session?.access_token;

  console.log('🔐 AuthFetch Debug:', {
    url: typeof input === 'string' ? input : input.toString(),
    hasToken: !!bearerToken,
    tokenLength: bearerToken?.length || 0
  });

  // Create new headers object
  const headers = new Headers(init?.headers);
  
  // Add authorization header if token is available
  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
    console.log('🔐 AuthFetch Debug: Added Authorization header');
  } else {
    console.log('🔐 AuthFetch Debug: No token available');
  }

  // Call the original fetch with modified options
  return originalFetch(input, {
    ...init,
    headers,
  });
}

// Override the global fetch to use our auth fetch
export function setupAuthFetch() {
  console.log('🔐 Setting up auth fetch override');
  global.fetch = authFetch;
} 