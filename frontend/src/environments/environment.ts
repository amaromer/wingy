export const environment = {
  production: false,
  apiUrl: 'https://winjyerp.com/api' // Use HTTPS for production
};

// Function to get the correct API URL based on current hostname
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If accessing from localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:3000/api`;
    }
    
    // If accessing from production domain, use HTTPS
    if (hostname === 'winjyerp.com' || hostname === 'www.winjyerp.com') {
      return `https://${hostname}/api`;
    }
    
    // If accessing from mobile/network, use the same protocol and hostname
    return `${protocol}//${hostname}/api`;
  }
  
  // Fallback for server-side rendering
  return environment.apiUrl;
} 