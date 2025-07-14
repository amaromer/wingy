import { HttpInterceptorFn } from '@angular/common/http';
import { getApiUrl } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests to the API
  if (req.url.startsWith('/api/')) {
    const apiUrl = getApiUrl();
    const fullUrl = req.url.replace('/api/', `${apiUrl}/`);
    
    console.log('API Interceptor Debug:', {
      originalUrl: req.url,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'server-side',
      resolvedApiUrl: apiUrl,
      fullUrl: fullUrl
    });
    
    const modifiedRequest = req.clone({
      url: fullUrl
    });
    
    return next(modifiedRequest);
  }
  
  return next(req);
}; 