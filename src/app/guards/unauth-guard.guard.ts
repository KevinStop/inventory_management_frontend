import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UnauthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.userService.getUserDetails().pipe(
      map((user) => {
        if (user) {
          // Redirigir al usuario según su rol
          if (user.role === 'admin') {
            this.router.navigate(['/home/electronicComponent']);
          } else if (user.role === 'user') {
            this.router.navigate(['/home/viewComponents']);
          } else {
            this.router.navigate(['/home']);
          }

          return false;
        }
        return true;
      }),
      catchError(() => of(true)) 
    );
  }
}
