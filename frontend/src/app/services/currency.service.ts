import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, from, pipe, interval, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, retryWhen, flatMap, count, retry } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }



  // get all currencies for user
  public getAllCurrencies(): Observable<any> {
    return this.apiService.request('get', 'displayWalletForUser');
  }

  // genrate wallet for user
  public genratWallet(): Observable<any> {
    return this.apiService.request('get', 'genrateWalletForUser');
  }

  // genrate fiat wallet for user
  public genrateFiatWalletForUser(): Observable<any> {
    return this.apiService.request('get', 'fiatCurrencyWallet');
  }

  // display user fiat wallet for user
  public displayFiatWalletForUser(): Observable<any> {
    return this.apiService.request('get', 'displayUserFiatWallet');
  }


  public displayTradeWallet(): Observable<any> {
    return this.apiService.request('get', 'displayTradeWalletForUser');
  }

  // activate user crypto wallet service methods
  public activateWallet(walletObj): Observable<any> {
    return this.apiService.externalrequest('post', 'activateCryptoWallet', walletObj);
  }


  // send crypto to other user
  public sendCryptoToOthers(sendCrypto): Observable<any> {
    return this.apiService.externalrequest('post', 'transferCryptoOthers', sendCrypto);
  }


  // activating token if ether activated
  public updateEtherInToken(): Observable<any> {
    return this.apiService.request('get', 'activatingToken');
  }



  // send receive Transaction of crypto
  public userCryptoTransaction(symbol, pageIndex, pageSize, search): Observable<any> {
    return this.apiService.externalrequest
      ('get', 'sendReceiveCryptoTxn' + '?symbol=' + symbol + '&pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }


  // top up crypto for trade
  public topUpCryptoForTrade(topUpTrade): Observable<any> {
    return this.apiService.externalrequest('post', 'topupCryptoForTrade', topUpTrade);
  }

  // withdraw crypto from trade
  public withdrawCryptoFromTrade(withdrawTrade): Observable<any> {
    return this.apiService.externalrequest('post', 'withdrawCryptoForTrade', withdrawTrade);
  }


  // send receive Transaction of trade
  public userCryptoTradeTransaction(symbol, pageIndex, pageSize, search): Observable<any> {
    return this.apiService.externalrequest
      ('get', 'sendReceiveTradeTxn' + '?symbol=' + symbol + '&pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }




  // user fiat transactions
  public userFiatTransaction(symbol, pageIndex, pageSize, search): Observable<any> {
    return this.apiService.externalrequest
      ('get', 'userFiatTransactions' + '?symbol=' + symbol + '&pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }


  // send code for getting code for withdrawing crypto
  public sendCodeOnEmail(detailsForCode): Observable<any> {
    return this.apiService.externalrequest('post', 'sendCodeOnEmail', detailsForCode);
  }


  // buy crypto by euro
  public buyCryptoTrade(buyDetails): Observable<any> {
    return this.apiService.externalrequest('post', 'buyCryptoTrade', buyDetails);
  }

  // sell crypto currency
  public sellCryptoTrade(sellDetails): Observable<any> {
    return this.apiService.externalrequest('post', 'sellCryptoTrade', sellDetails);
  }


  public exmoPiarBuySellPrice(): Observable<any> {
    return this.http.get('https://api.exmo.com/v1/ticker/');
  }

}
