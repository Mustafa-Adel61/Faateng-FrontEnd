// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }
//   return next(req);
// };
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  const token = localStorage.getItem('token');

  // ابعت التوكن
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(

    catchError((error: HttpErrorResponse) => {

      // لو Unauthorized
      if (error.status === 401) {

        // امسح التوكن
        localStorage.removeItem('token');

        // روح للوجين
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })

  );
};