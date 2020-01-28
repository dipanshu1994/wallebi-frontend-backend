import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

/*
    interface for token
 */
interface TokenResponse {
  token: string;
}


/*
    specific format of create user call reponse
 */
export interface UserDetails {
  _id: string;
  email: string;
  name: string;
  userid: number;
  usercurrency: string;
  exp: number;
  iat: number;
}

@Injectable(
  {
    providedIn: 'root'
  }
)
export class ApiService {

  apiURL: string = environment.apiEndPoint;

  private token: string;
  public env: string;

  constructor(private http: HttpClient, private router: Router) {
  }

  /*
      save token into localStorage as a item with specific key
   */
  private saveToken(token: string): void {
    localStorage.setItem('sdasd923hd9dwe', token);
    this.token = token;
  }



  /*
      call for fetch token from localStrogae
   */
  private getToken(): string {

    if (!this.token) {
      this.token = localStorage.getItem('sdasd923hd9dwe');
    }
    return this.token;
  }

  /*
      fetch user token details
   */
  public getUserDetails(): UserDetails {
    const token = this.getToken();
    let payload;
    if (token) {
      payload = token.split('.')[1];
      payload = window.atob(payload);
      return JSON.parse(payload);
    } else {
      return null;
    }
  }

  /*
      call for check the user session
   */
  public isLoggedIn(): boolean {
    const user = this.getUserDetails();
    if (user) {
      return user.exp > Date.now() / 1000;
    } else {
      return false;
    }
  }


  /*
      all type of api call handlers at client side and send token in header in all GET api call to verify valid user
      application at back end match user token with this token, if both token are match means this is a valid user otherwise
      return with a exception invalid user
   */
  public request(method: 'post' | 'get', type, user?, paramslist?): Observable<any> {
    let base;

    if (method === 'post') {
      if (type === 'registration' || type === 'login' || type === 'securityauth') {
        base = this.http.post<any>(`${this.apiURL}users/` + type, user, {
          withCredentials: true
        });
      } else {
        base = this.http.post<any>(`${this.apiURL}users/` + type, user, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${this.getToken()}` }
        });
      }
    } else {
      base = this.http.get<any>(`${this.apiURL}users/` + type, {
        headers: { Authorization: `Bearer ${this.getToken()}` },
        withCredentials: true,
        params: paramslist
      });
    }
    const request = base.pipe(
      map((data: TokenResponse) => {
        if (data !== null && data.token) {
          this.saveToken(data.token);
        }
        return data;
      })
    );

    return request;
  }

  // headers: {'env':this.cookieService.get('env')}
  public externalrequest(method: 'post' | 'get', type, user?, paramslist?): Observable<any> {
    if (method === 'get') {
      return this.http.get<any>(`${this.apiURL}userWallets/` + type, {
        headers: { Authorization: `Bearer ${this.getToken()}` },
        withCredentials: true, params: paramslist
      });
    } else {
      return this.http.post<any>(`${this.apiURL}userWallets/` + type, user, {
        headers: { Authorization: `Bearer ${this.getToken()}` },
        withCredentials: true, params: paramslist
      });
    }
  }



  // 'env':this.cookieService.get('env')
  public logout(): void {
    this.env = '';
    this.token = '';
    window.localStorage.removeItem('env');
    window.localStorage.removeItem('sdasd923hd9dwe');
    this.router.navigateByUrl('/index');
  }

  public getAuthenticationOptions(): Observable<any> {
    return this.request('get', 'authoptions');
  }

  public verifyAuthentication(authObj): Observable<any> {
    return this.request('post', 'verifyauthentication', authObj);
  }

  // getting exchange rate for every coin
  public exchangeRate(): Observable<any> {
    return this.http.get('https://api.coinmarketcap.com/v2/ticker/?convert=EUR&limit=100');
  }


  // getting user ip info
  public getUserCountry(): Observable<object> {
    return this.http.get('https://ipinfo.io/');
  }
}
