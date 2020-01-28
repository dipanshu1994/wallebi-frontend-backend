import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { TopupCryptoComponent } from '../topup-crypto/topup-crypto.component';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CurrencyService } from 'src/app/services/currency.service';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-withdraw-crypto',
  templateUrl: './withdraw-crypto.component.html',
  styleUrls: ['./withdraw-crypto.component.css']
})
export class WithdrawCryptoComponent implements OnInit {


  // getting boolen value from trade currencies component and opening only one model at a time
  withdrawEuro = false;
  withdrawCrypto = false;


  coinTypes: any;

  // currencies current rate in euro
  cryptoCurrentPrice = 0;



  // users bitcoin trade balance
  cryptoTradeBalanceInEuro = 0.0;

  hiddenField = false;
  disabledButton = false;



  // crypto transaction fee
  cryptoTransactionFee = 0;

  // for how much cost with fee
  btcWithFee = 0;


  // convert crypto to euro
  cryptoToEuro: any;



  logo: string;
  currencyId: string;
  balance: number;
  symbol: string;
  title: string;
  type: string;


  cryptoWithdrawForm = new FormGroup({
    coinType: new FormControl('', [Validators.required]),
    withdrawAmount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    withdrawAmountInEuro: new FormControl(''),
    cryptoCurrentPrice: new FormControl(''),
    cryptoTransactionFee: new FormControl(''),
    currencyId: new FormControl('', [Validators.required]),
    symbol: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required])
  });



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private withdrawDailogRef: MatDialogRef<TopupCryptoComponent>,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private currencyService: CurrencyService,
    private socketService: SocketService
  ) {
    this.socketService.data.subscribe((updated: any) => {
      this.balance = updated;
    });
    this.translate.setDefaultLang('en');
    if (data) {
      if (data.withdrawEuro) {
        this.withdrawEuro = data.withdrawEuro;
      }
      if (data.withdraw) {
        this.withdrawCrypto = data.withdraw;
        this.balance = data.balance;
        this.currencyId = data.currencyId;
        this.logo = data.logo;
        this.symbol = data.symbol;
        this.type = data.type;
      }
    }
  }

  ngOnInit() {
    if (this.withdrawCrypto) {
      this.cryptoWithdrawForm.patchValue({ coinType: this.symbol });
      this.cryptoWithdrawForm.patchValue({currencyId: this.currencyId});
      this.cryptoWithdrawForm.patchValue({symbol: this.symbol});
      this.cryptoWithdrawForm.patchValue({type: this.type});
    }
  }




  // getting controls of withdraw bitcoin form validation
  get withdrawCryptoControl() { return this.cryptoWithdrawForm.controls; }





  // converting value of crypto to euro
  convertCryptoToEuro(value: number) {
    this.cryptoWithdrawForm.patchValue({ bitcoinCurrentPrice: this.cryptoCurrentPrice });
    if (value[0] === '.') {
      const newValue = `0${value}`;
      this.cryptoWithdrawForm.patchValue({ withdrawAmount: newValue });
    }
    this.cryptoToEuro = value * this.cryptoCurrentPrice;
    // this.btcWithFee = Number(value) + (Number(value) * Number(this.btcFee));
  }



  sendCode(formGroup) {
    this.disabledButton = true;
    this.currencyService.sendCodeOnEmail(formGroup.value).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        this.hiddenField = false;
        this.disabledButton = false;
      }
      if (result.success === true) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.hiddenField = true;
        this.disabledButton = false;
        formGroup.addControl('verifyCode', new FormControl('', [Validators.required]));
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      this.hiddenField = false;
      this.disabledButton = false;
    });
  }



  sendEmailCodeForWithdrawing() {
    this.sendCode(this.cryptoWithdrawForm);
  }



  withdrawalCryptoFromTrade() {
    if (this.cryptoWithdrawForm.invalid) {
      return false;
    } else {
      this.disabledButton = true;
      this.currencyService.withdrawCryptoFromTrade(this.cryptoWithdrawForm.value).subscribe((result) => {
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.disabledButton = false;
        }
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.disabledButton = false;
          this.cryptoWithdrawForm.reset();
        }
      });
    }
  }


  // closing the withdrawing crypto dialog
  closeDilaog() {
    this.withdrawDailogRef.close();
  }

}
