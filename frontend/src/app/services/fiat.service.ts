import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiatService {

  constructor(
    private apiService: ApiService
  ) { }


  public receivedata = new BehaviorSubject('no data');
  datapreview = this.receivedata.asObservable();


  setpreviewdata(data) {
    this.receivedata.next(data);
  }

  getpreviewMessage(): Observable<any> {
    return this.receivedata.asObservable();
  }


  public getExchangeRate(convert): Observable<any> {
    return this.apiService.externalrequest('post', 'currencyExchangeRate', convert);
  }


  public topUpEuro(fiatDetails): Observable<any> {
    return this.apiService.externalrequest('post', 'creditFiatAmount', fiatDetails);
  }

  public userEuroBalance(): Observable<any> {
    return this.apiService.externalrequest('get', 'userEuroBalance');
  }


  public verifyUserPayment(authority): Observable<any> {
    return this.apiService.externalrequest('post', 'updateTransaction?' + 'authority=' + authority);
  }
}
