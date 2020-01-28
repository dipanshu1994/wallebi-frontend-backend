import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private apiService: ApiService
  ) { }

  public allUsersDetails(pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request('get', 'allUsers' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }


  // approve user profile
  public approveUserProfile(profileStatus): Observable<any> {
    return this.apiService.request('post', 'approveProfile', profileStatus);
  }


  public getSingleUserInfo(userId): Observable<any> {
    return this.apiService.request('get', 'userDetails/' + userId);
  }


  public getWalletsInfo(userId): Observable<any> {
    return this.apiService.request('get', 'userWallets/' + userId);
  }


  public getTradeWalletsInfo(userId): Observable<any> {
    return this.apiService.request('get', 'userTradeWallets/' + userId);
  }


  public getUserLoginLogsInfo(userDetails): Observable<any> {
    return this.apiService.request('get', 'userLoginLogs/' + userDetails);
  }


  verifyAddressProof(verifyAddress): Observable<any> {
    return this.apiService.request('post', 'verifyAddressProof', verifyAddress);
  }

  rejectAddressProof(rejectAddress): Observable<any> {
    return this.apiService.request('post', 'rejectAddressProof', rejectAddress);
  }


  verifyCustomerSelfie(verifySelfie): Observable<any> {
    return this.apiService.request('post', 'verifyCustomerSelfie', verifySelfie);
  }

  rejectCustomerSelfie(rejectSelfie): Observable<any> {
    return this.apiService.request('post', 'rejectCustomerSelfie', rejectSelfie);
  }

  verifyCustomerBackSide(backSide): Observable<any> {
    return this.apiService.request('post', 'verifyCustomerBackSide', backSide);
  }

  rejectCustomerBackSide(rejectBackSide): Observable<any> {
    return this.apiService.request('post', 'rejectCustomerBackSide', rejectBackSide);
  }

  verifyCustomerFrontSide(frontSide): Observable<any> {
    return this.apiService.request('post', 'verifyCustomerFrontSide', frontSide);
  }

  rejectCustomerFrontSide(rejectFrontSide): Observable<any> {
    return this.apiService.request('post', 'rejectCustomerFrontSide', rejectFrontSide);
  }


  public disableCustomer(disableUser): Observable<any> {
    return this.apiService.request('post', 'disableCustomer', disableUser);
  }


  // send receive Transaction
  public userAllTransaction(userId, pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request
      ('get', 'userAllTransaction' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search + '&userId=' + userId);
  }


// topup  Transaction
public userAllTopupTransaction(userId, pageIndex, pageSize, search): Observable<any> {
  return this.apiService.request
    ('get', 'userAllTopupTransaction' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search + '&userId=' + userId);
}

// withdraw Transaction
public userAllWithdrawTransaction(userId, pageIndex, pageSize, search): Observable<any> {
  return this.apiService.request
    ('get', 'userAllWithdrawTransaction' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search + '&userId=' + userId);
}

// topupreq Transaction
public userAllTopupreqTransaction(userId, pageIndex, pageSize, search): Observable<any> {
  return this.apiService.request
    ('get', 'userAllTopupreqTransaction' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search + '&userId=' + userId);
}


// Admin transfer crypto to user account Transaction
public transferCryptoToUsers(transferCrypto): Observable<any> {
  return this.apiService.request
    ('post', 'transferCryptoToUsers', transferCrypto);
}

  // customer bank account
  public customerBankAccount(userId): Observable<any> {
    return this.apiService.request('get', 'userBankAccount/' + userId);
  }

  // approve or reject customer bank account
  public changeBankAccountStatus(userId, accountStatus): Observable<any> {
    return this.apiService.request('post', 'changeBankAccountStatus/' + userId, accountStatus);
  }


  // create new email template
  public createTemplate(template): Observable<any> {
    return this.apiService.request('post', 'createTemplate', template);
  }


  // getting all email template
  public allEmailTemplate(pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request('get', 'allEmailTemplate' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }


  // getting unique email template
  public getUniqueEmailTemplate(templateId): Observable<any> {
    return this.apiService.request('get', 'emailTemplate/' + templateId);
  }

  // delete email template
  public deleteEmailTemplate(templateId): Observable<any> {
    return this.apiService.request('get', 'deleteEmailTemplate/' + templateId);
  }


  public editEmailTemplate(template): Observable<any> {
    return this.apiService.request('post', 'updateEmailTemplate', template);
  }



  // create new currency
  public createCurrency(
    title: string,
    type: string,
    fee: string,
    feein: string,
    exchangeFee: string,
    exchangeFeein: string,
    tradeFee: string,
    tradeFeein: string,
    logo: File,
    contractAddress: string,
    symbol: string,
    status: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('fee', fee);
    formData.append('feein', feein);
    formData.append('exchangeFee', exchangeFee);
    formData.append('exchangeFeein', exchangeFeein);
    formData.append('tradeFee', tradeFee);
    formData.append('tradeFeein', tradeFeein);
    formData.append('logo', logo);
    formData.append('contractAddress', contractAddress);
    formData.append('symbol', symbol);
    formData.append('status', status);
    return this.apiService.request('post', 'createCurrency', formData);
  }


  // fetch all active or inactive currency
  public fetchAllCurrencies(pageIndex, pageSize, search): Observable<any> {
    return this.apiService.request('get', 'fetchCurrencies' + '?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&search=' + search);
  }

  // active or inactive any currencies
  changeStausOfCurrency(status: any, id: any): Observable<any> {
    return this.apiService.request('get', 'changeCurrencyStatus' + '?status=' + status + '&id=' + id);
  }

  // change trade satus of any currencies
  changeTradeStatus(tradeStatus: boolean, id: any): Observable<any> {
    return this.apiService.request('get', 'changeTradeStatus' + '?tradeStatus=' + tradeStatus + '&id=' + id);
  }

  // change buy & sell status from active to inactive
  changeCurrencyBuySellStatus(buySellStatus: boolean, id: any): Observable<any> {
    return this.apiService.request('get', 'changeBuyAndSellStatus' + '?buySellStatus=' + buySellStatus + '&id=' + id);
  }


}
