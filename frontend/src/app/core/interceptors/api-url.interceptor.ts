import { HttpInterceptorFn } from '@angular/common/http';
import { getApiUrl } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests to the API
  if (req.url.startsWith('/api/')) {
    const apiUrl = getApiUrl();
    const fullUrl = req.url.replace('/api/', `${apiUrl}/`);
    
    console.log('API Interceptor:', {
      original: req.url,
      resolved: fullUrl
    });
    
    const modifiedRequest = req.clone({
      url: fullUrl
    });
    
    return next(modifiedRequest);
  }
  
  return next(req);
}; 