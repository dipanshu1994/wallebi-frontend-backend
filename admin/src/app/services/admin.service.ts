import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }

  // login admin service method
  public login(admin): Observable<any> {
    return this.apiService.request('post', 'adminLogin', admin);
  }


  // getting admin profile
  public adminProfile(): Observable<any> {
    return this.apiService.request('get', 'adminProfile');
  }


  public walletGenrating(): Observable<any> {
    return this.apiService.request('get', 'genrateWallet');
  }


  public displayWallet(): Observable<any> {
    return this.apiService.request('get', 'displayWallet');
  }



  public activatedLiquidityProviders(pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request('get', 'activatedLiquidity' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }

  public changeProviderStatus(updateStatus): Observable<any> {
    return this.apiService.request('post', 'changeProviderStatus', updateStatus);
  }

  public getAllCurrencyPair(): Observable<any> {
    return this.apiService.request('get', 'getAllPairs');
  }

  // saving pair fee for every provider in the database
  public saveProviderPairFee(feeObject): Observable<any> {
    return this.apiService.request('post', 'saveProvidersPairFee', feeObject);
  }

  // getting pair fee from database
  public getAllProviderFee(pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request
      ('get', 'getAllPairsProvidersFee' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }

  // getting unique pair details
  public getUniquePairDetails(id): Observable<any> {
    return this.apiService.request('get', 'getUniquePairDetails' + '?id=' + id);
  }

  // update provider fee of pair
  updateProviderPairFee(updatedObject): Observable<any> {
    return this.apiService.request('post', 'updateProviderFee', updatedObject);
  }

  // updating pair status
  updateProvidePairStatus(id, status): Observable<any> {
    return this.apiService.request('get', 'updatePairStatus' + '?id=' + id + '&status=' + status);
  }

}
