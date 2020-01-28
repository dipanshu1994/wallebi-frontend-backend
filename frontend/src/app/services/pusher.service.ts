
declare const Pusher: any;
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PusherService {

  pusher: any;
  channelBTCSend: any;
  channelBTCReceive: any;
  channelETHSend: any;
  channelETHReceive: any;
  channelUSDTSend: any;
  channelUSDTReceive: any;
  channelLTCSend: any;
  channelLTCReceive: any;
  channelXMRSend: any;
  channelXMRReceive: any;
  channelBCHSend: any;
  channelBCHReceive: any;
  channelXRPSend: any;
  channelXRPReceive: any;
  channelXLMSend: any;
  channelXLMReceive: any;


  constructor() {
    this.pusher = new Pusher('f588fdb1405ed9563e5c', {
      cluster: 'ap2',
      encrypted: true
    });
    this.channelBTCSend = this.pusher.subscribe('Wallebi_com_BTC_Send');
    this.channelBTCReceive = this.pusher.subscribe('Wallebi_com_BTC_Receive');
    this.channelETHSend = this.pusher.subscribe('Wallebi_com_ETH_Send');
    this.channelETHReceive = this.pusher.subscribe('Wallebi_com_ETH_Receive');
    this.channelUSDTSend = this.pusher.subscribe('Wallebi_com_USDT_Send');
    this.channelUSDTReceive = this.pusher.subscribe('Wallebi_com_USDT_Receive');
    this.channelLTCSend = this.pusher.subscribe('Wallebi_com_LTC_Send');
    this.channelLTCReceive = this.pusher.subscribe('Wallebi_com_LTC_Receive');
    this.channelXMRSend = this.pusher.subscribe('Wallebi_com_XMR_Send');
    this.channelXMRReceive = this.pusher.subscribe('Wallebi_com_XMR_Receive');
    this.channelBCHSend = this.pusher.subscribe('Wallebi_com_BCH_Send');
    this.channelBCHReceive = this.pusher.subscribe('Wallebi_com_BCH_Receive');
    this.channelXRPSend = this.pusher.subscribe('Wallebi_com_XRP_Send');
    this.channelXRPReceive = this.pusher.subscribe('Wallebi_com_XRP_Receive');
    this.channelXLMSend = this.pusher.subscribe('Wallebi_com_XLM_Send');
    this.channelXLMReceive = this.pusher.subscribe('Wallebi_com_XLM_Receive');

  }
}
