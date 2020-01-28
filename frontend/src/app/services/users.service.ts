import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }


  // user registeration service method
  public registration(user): Observable<any> {
    return this.apiService.request('post', 'userRegistration', user);
  }

  // verify user email serive method
  public verifyEmail(token): Observable<any> {
    return this.apiService.request('get', 'emailVerification/' + token);
  }


  // resend email for email verification
  resendEmail(email): Observable<any> {
    return this.apiService.request('post', 'resendEmail', email);
  }


  // verify unautorized device
  public verifyDevice(deviceObject): Observable<any> {
    return this.apiService.request('post', 'deviceVerification',  deviceObject);
  }


  // login user service method
  public login(user): Observable<any> {
    return this.apiService.request('post', 'userLogin', user);
  }

  // login user service method when 2FA enable
  public VerifyLoginOTP(details): Observable<any> {
    return this.apiService.request('post', 'verifyLoginOTP', details);
  }
  // send email link for forgot password service method
  public forgotPassword(email) {
    return this.apiService.request('post', 'forgetPassword', email);
  }

  // reset password service method
  public resetPassword(token): Observable<any> {
    return this.apiService.request('post', 'reset-password', token);
  }

  // getting user profile
  public userProfile(): Observable<any> {
    return this.apiService.request('get', 'getProfile');
  }


  // update user profile service method
  public updateProfilePicture(profilePicture): Observable<any> {
    return this.apiService.request('post', 'updateProfilePicture', profilePicture);
  }


  // update user language
  public changeLanguage(language): Observable<any> {
    return this.apiService.request('post', 'updateLanguage', language);
  }

  // register user with referral code
  public registerWithReferral() {
    return this.apiService.request('get', 'getReferralRegister');
  }


}
