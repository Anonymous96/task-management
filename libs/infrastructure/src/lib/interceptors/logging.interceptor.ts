import {
  HttpInterceptorFn,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';

export const LoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  logRequest(request, requestId);

  return next(request).pipe(
    tap(
      (event: any) => {
        if (event instanceof HttpResponse) {
          logResponse(event, requestId, startTime);
        }
      },
      (error: HttpErrorResponse) => {
        logError(error, requestId, startTime);
      }
    ),
    finalize(() => {
      const duration = Date.now() - startTime;
      console.log(`🔚 Request ${requestId} completed in ${duration}ms`);
    })
  );
};

function logRequest(request: any, requestId: string): void {
  const shouldLog = shouldLogRequest(request);

  if (shouldLog) {
    console.group(
      `🚀 HTTP ${request.method.toUpperCase()} Request ${requestId}`
    );
    console.log('URL:', request.url);
    console.log('Headers:', sanitizeHeaders(request.headers));

    if (request.body) {
      console.log('Body:', sanitizeBody(request.body));
    }

    console.groupEnd();
  }
}

function logResponse(
  response: HttpResponse<any>,
  requestId: string,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const shouldLog = shouldLogRequest(response.url || '');

  if (shouldLog) {
    console.group(`✅ HTTP Response ${requestId} (${duration}ms)`);
    console.log('Status:', response.status, response.statusText);
    console.log('URL:', response.url);
    console.log('Headers:', sanitizeHeaders(response.headers));

    if (response.body) {
      console.log('Body:', sanitizeResponseBody(response.body));
    }

    console.groupEnd();
  }
}

function logError(
  error: HttpErrorResponse,
  requestId: string,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const shouldLog = shouldLogRequest(error.url || '');

  if (shouldLog) {
    console.group(`❌ HTTP Error ${requestId} (${duration}ms)`);
    console.log('Status:', error.status, error.statusText);
    console.log('URL:', error.url);
    console.log('Error:', error.error);
    console.groupEnd();
  }
}

function shouldLogRequest(urlOrRequest: string | any): boolean {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost'
  ) {
    return false;
  }

  const url =
    typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url;

  const skipEndpoints = ['/health', '/ping', '/metrics'];

  return !skipEndpoints.some((endpoint) => url.includes(endpoint));
}

function sanitizeHeaders(headers: any): any {
  const sanitized: any = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];

  if (headers.keys) {
    headers.keys().forEach((key: string) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = headers.get(key);
      }
    });
  }

  return sanitized;
}

function sanitizeBody(body: any): any {
  if (!body) return body;

  if (typeof body === 'object') {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  return body;
}

function sanitizeResponseBody(body: any): any {
  if (!body) return body;

  if (Array.isArray(body) && body.length > 10) {
    return `[Array with ${body.length} items]`;
  }

  if (typeof body === 'object' && Object.keys(body).length > 20) {
    return `[Object with ${Object.keys(body).length} properties]`;
  }

  return sanitizeBody(body);
}

function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9);
}
