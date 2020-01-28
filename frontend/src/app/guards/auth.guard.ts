import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { CanActivate } from '@angular/router';

import { ApiService } from '../services/api.service';
import { UsersService } from '../services/users.service';
import { UserKycVerificationService } from '../services/user-kyc-verification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UsersService,
    private userkyc: UserKycVerificationService
    ) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.apiService.isLoggedIn()) {
      this.userkyc.getKycStatus().subscribe((result) => {
        if (result) {
          if (result.success === false) {
            this.router.navigate(['kyc-verification']);
          } else {
            if (result.step < 5) {
              this.router.navigate(['kyc-verification']);
            } else {
              this.router.navigate(['profile']);
            }
          }
        }
      });
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}
