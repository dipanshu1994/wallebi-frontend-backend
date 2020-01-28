import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminWalletService {

  constructor(
    private apiService: ApiService
  ) { }


  // activate admin's bitcoin wallet
  public activateCryptoWallet(wallet): Observable<any> {
    return this.apiService.request('post', 'activateCrypto', wallet);
  }


  // activating admin token for admin
  public updatingEthereumInToken(): Observable<any> {
    return this.apiService.request('get', 'activatingAdminToken');
  }

  public getAdminCryptoTransaction(symbol, pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request
      ('get', 'sendReceiveCryptoTxnAdmin'
      + '?symbol=' + symbol + '&pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }


  // creating admin fiat wallet
  public genrateAdminFiatWallet(): Observable<any> {
    return this.apiService.request('get', 'createAdminFiatWallet');
  }

  // fetching admin fiat currency wallet
  public fetchAdminFiatWallet(): Observable<any> {
    return this.apiService.request('get', 'fetchAdminFiatWallet');
  }


}
