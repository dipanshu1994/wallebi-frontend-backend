import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatSnackBar, MatDialogRef } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { PusherService } from 'src/app/services/pusher.service';
import { ApiService } from 'src/app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { CurrencyService } from 'src/app/services/currency.service';
import { Container } from '@angular/compiler/src/i18n/i18n_ast';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-send-crypto',
  templateUrl: './send-crypto.component.html',
  styleUrls: ['./send-crypto.component.css']
})
export class SendCryptoComponent implements OnInit {


  // for how much cost with fee
  cryptoWithFee = 0;



  // crypto transaction fee
  btcFee = 0;




  // for displaying user currenices input to convert them into the euro
  cryptoToEuro = 0.0;


  // currencies current rate in euro
  bitCoinCurrentRate = 0;





  hiddenField = true;
  disableButton = false;
  invalidAddressMessage = '';


  slowFee = 0.0;
  averageFee = 0.0;
  fastFee = 0.0;
  user: any;

  send: any;
  logo: string;
  serverURL: string;
  title: string;
  symbol: string;
  balance: string;
  currencyId: string;
  contractAddress: string;
  type: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sendDailogRef: MatDialogRef<SendCryptoComponent>,
    private pusherService: PusherService,
    private apiService: ApiService,
    private translate: TranslateService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private socketService: SocketService
  ) {
    this.socketService.data.subscribe((updated: any) => {
      this.balance = updated;
    });
    this.serverURL = environment.currencyImage;

    this.translate.setDefaultLang('en');

    if (data) {
      this.send = data.send;
      this.logo = this.serverURL + data.logos;
      this.title = data.titles;
      this.symbol = data.symbols;
      this.balance = data.balances;
      this.currencyId = data.currencyId;
      this.contractAddress = data.contracts;
      this.type = data.type;
    }
  }

  // send crypto form
  sendCryptoForm = new FormGroup({
    receiverAddress: new FormControl('', [Validators.required]),
    cryptoAmount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    cryptoToEuro: new FormControl(''),
    cryptoWithFee: new FormControl(''),
    symbol: new FormControl('', [Validators.required]),
    currencyId: new FormControl('', [Validators.required]),
    contractAddress: new FormControl(''),
    type: new FormControl('', [Validators.required])
  });







  ngOnInit() {
    this.sendCryptoForm.patchValue({ symbol: this.symbol });
    this.sendCryptoForm.patchValue({ currencyId: this.currencyId });
    this.sendCryptoForm.patchValue({ contractAddress: this.contractAddress });
    this.sendCryptoForm.patchValue({ type: this.type });
    this.user = this.apiService.getUserDetails();
  }




  // converting value of crypto in to euro
  convertCrypto(value: number) {
    if (value[0] === '.') {
      const newValue = `0${value}`;
      this.sendCryptoForm.patchValue({ crypto: newValue });
    }
    this.cryptoToEuro = value * this.bitCoinCurrentRate;
    this.cryptoWithFee = Number(value) + (Number(value) * Number(this.cryptoWithFee));
    this.sendCryptoForm.patchValue({ cryptoWithFee: this.cryptoWithFee });
  }





  // getting controls of send crypto form validation
  get coinControl() { return this.sendCryptoForm.controls; }




  // sending crypto to antoher user
  sendCryptoAmount() {
    this.disableButton = true;
    if (this.sendCryptoForm.invalid) {
      return false;
    } else {
      this.currencyService.sendCryptoToOthers(this.sendCryptoForm.value).subscribe((result) => {
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.disableButton = false;
        }
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.sendCryptoForm.controls.cryptoAmount.reset();
          this.sendCryptoForm.controls.cryptoToEuro.reset();
          this.disableButton = false;
        }
      }, error => {
        this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        this.disableButton = false;
      });
    }
  }



  // closing the sending crypto dialog
  closeDilaog() {
    this.sendDailogRef.close();
  }
}
