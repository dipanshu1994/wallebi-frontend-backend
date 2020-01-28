import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSecurityService {

  constructor(private apiService: ApiService) { }


  // update user password
  public updateUserPassword(details): Observable<any> {
    return this.apiService.request('post', 'changePassword', details);
  }

  // update user password when 2FA enable
  public verifyChnagePasswordOTP(details): Observable<any> {
    return this.apiService.request('post', 'changePasswordVerifyOTP', details);
  }

  // enable 2FA login service method
  public twoFALogin(state): Observable<any> {
    return this.apiService.request('post', 'twoFAForLogin', state);
  }

  // check status 2FA login
  public twoFAStausofLogin(): Observable<any> {
    return this.apiService.request('get', 'statusTwoFALogin');
  }

  // enable 2FA for withdraw service method
  public twoFAForWithdraw(state): Observable<any> {
    return this.apiService.request('post', 'twoFAForWithdraw', state);
  }

  // check status 2FA withdraw
  public twoFAStausofWithdraw(): Observable<any> {
    return this.apiService.request('get', 'statusTwoFAWithdraw');
  }

  // enable 2FA fro password change service method
  public twoFAForPasswordChange(state): Observable<any> {
    return this.apiService.request('post', 'twoFAForPasswordChange', state);
  }

  // check status 2FA password change
  public twoFAStausofPasswordChange(): Observable<any> {
    return this.apiService.request('get', 'statusTwoFAChangePassword');
  }

  // enable 2FA for trade service method
  public twoFAforTrade(state): Observable<any> {
    return this.apiService.request('post', 'twoFAForTrade', state);
  }

  // check status 2FA withdraw
  public twoFAStausofTrade(): Observable<any> {
    return this.apiService.request('get', 'statusTwoFAForTrade');
  }

  // get google QR code
  public getGoogleQRCode(): Observable<any> {
    return this.apiService.request('get', 'getUserGoogleQRCode');
  }
}
