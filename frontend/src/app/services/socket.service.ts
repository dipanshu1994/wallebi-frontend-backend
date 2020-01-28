import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { Observer } from '@syncfusion/ej2-base';
import { BehaviorSubject } from 'rxjs';
import { Data } from '@syncfusion/ej2-charts/src/common/model/data';
import { environment } from 'src/environments/environment';

@Injectable(
  {
    providedIn: 'root'
  }
)
export class SocketService {
  private socket: SocketIOClient.Socket;

  private dataSource = new BehaviorSubject<any>('default');
  data = this.dataSource.asObservable();

  constructor() {
    this.socket = io(environment.socketURL);
  }



  updatedDataSelection(data: Data) {
    this.dataSource.next(data);
  }

  // EMITTER
  public sendMessage(msg: string) {
    this.socket.emit('sendMessage', { message: msg });
  }

  // registerHandler(onMessageReceived) {
  //   socket.on('message', onMessageReceived)
  // }

  public unregisterHandler() {
    this.socket.off('updatebalance');
  }

  public unregisterHandler_limitorder() {
    this.socket.off('limitorder');
  }

  public disconnect() {
    this.socket.disconnect();
  }

  // HANDLER
  public onNewMessage() {
    return Observable.create(observer => {
      this.socket.on('updatebalance', msg => {

        observer.next(msg);

      });
    });
  }

  // This is used when there is change in Limit Order creation
  public onNewMessageLimitOrder() {
    return Observable.create(observer => {
      this.socket.on('limitorder', msg => {
        observer.next(msg);
      });
    });
  }


  public onUpdateProfile(userId) {
    return Observable.create(observer => {
      this.socket.on(`userProfile_${userId}`, profile => {
        observer.next(profile);
      });
    });
  }


  public onUpdateProfileUnSubscribe(userId) {
    this.socket.removeEventListener(`userProfile_${userId}`);
  }

  public onSendReceive(userId) {
    return Observable.create(observer => {
      this.socket.on(`sendReceive_${userId}`, (msg) => {
        observer.next(msg);
      });
    });
  }


  public onSendReceiveUnSubscribe(userId) {
    this.socket.removeEventListener(`sendReceive_${userId}`);
  }


  public onSendReceiveTrade(userId) {
    return Observable.create(observer => {
      this.socket.on(`sendReceiveTrade_${userId}`, (msg) => {
        observer.next(msg);
      });
    });
  }



  public onSendReceiveTradeUnSubscribe(userId) {
    this.socket.removeEventListener(`sendReceiveTrade_${userId}`);
  }



  public onBuySellTrade(userId) {
    return Observable.create(observer => {
      this.socket.on(`sendReceiveTrade_${userId}`, (msg) => {
        observer.next(msg);
      });
    });
  }



  public onBuySellTradeUnSubscribe(userId) {
    this.socket.removeEventListener(`sendReceiveTrade_${userId}`);
  }



  public onFiatSocketSubscribe(userId) {
    return Observable.create(observer => {
      this.socket.on(`fiatTransaction_${userId}`, (fiat => {
        observer.next(fiat);
      }));
    });
  }


  public onFiatUnSubscribe(userId) {
    this.socket.removeEventListener(`fiatTransaction_${userId}`);
  }


  public onNewCurrency() {
    return Observable.create(observer => {
      this.socket.on(`newCurrencyCreation`, (newCurrency) => {
        observer.next(newCurrency);
      });
    });
  }


  public onNewCurrencyUnSubscribe() {
    this.socket.removeEventListener(`newCurrencyCreation`);
  }



  public onNewWallet() {
    return Observable.create(observer => {
      this.socket.on(`fetchNewCurrencyWallet`, (newCurrency) => {
        observer.next(newCurrency);
      });
    });
  }


  public onNewWalletUnSubscribe() {
    this.socket.removeEventListener(`fetchNewCurrencyWallet`);
  }


}
