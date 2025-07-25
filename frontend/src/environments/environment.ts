export const environment = {
  production: false,
  apiUrl: 'https://winjyerp.com/api' // Use HTTPS for production
};

// Function to get the correct API URL based on current hostname
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    console.log('Environment check:', { hostname, protocol, port });
    
    // If accessing from localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localhostUrl = `http://localhost:3000/api`;
      console.log('Environment: Using localhost API URL:', localhostUrl);
      return localhostUrl;
    }
    
    // If accessing from production domain, use HTTPS
    if (hostname === 'winjyerp.com' || hostname === 'www.winjyerp.com') {
      const productionUrl = `https://${hostname}/api`;
      console.log('Environment: Using production API URL:', productionUrl);
      return productionUrl;
    }
    
    // If accessing from mobile/network, use the same protocol and hostname
    const networkUrl = `${protocol}//${hostname}/api`;
    console.log('Environment: Using network API URL:', networkUrl);
    return networkUrl;
  }
  
  // Fallback for server-side rendering
  console.log('Environment: Using fallback API URL:', environment.apiUrl);
  return environment.apiUrl;
} 