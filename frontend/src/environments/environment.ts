export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // Default for localhost
};

// Function to get the correct API URL based on current hostname
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = '3000'; // Backend port - matches env.example
    
    // If accessing from localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api`;
    }
    
    // If accessing from mobile/network, use the same hostname
    return `http://${hostname}:${port}/api`;
  }
  
  // Fallback for server-side rendering
  return environment.apiUrl;
} 