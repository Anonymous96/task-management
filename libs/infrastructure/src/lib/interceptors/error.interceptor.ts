import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const ErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      handleHttpError(error, request);
      return throwError(() => error);
    })
  );
};

function handleHttpError(error: HttpErrorResponse, request: any): void {
  const message = getErrorMessage(error);

  console.error('HTTP Error:', {
    status: error.status,
    statusText: error.statusText,
    url: error.url,
    error: error.error,
    message: message,
  });
}

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.error instanceof ErrorEvent) {
    return `Network error: ${error.error.message}`;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  switch (error.status) {
    case 0:
      return 'Unable to connect to server. Please check your internet connection.';
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict: The resource already exists or is being used.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return `Unexpected error (${error.status}). Please try again.`;
  }
}
