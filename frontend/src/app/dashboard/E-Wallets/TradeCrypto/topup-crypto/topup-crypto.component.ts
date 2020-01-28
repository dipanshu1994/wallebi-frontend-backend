import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BankAccountService } from 'src/app/services/bank-account.service';
import { TranslateService } from '@ngx-translate/core';
import { CurrencyService } from 'src/app/services/currency.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FiatService } from 'src/app/services/fiat.service';

@Component({
  selector: 'app-topup-crypto',
  templateUrl: './topup-crypto.component.html',
  styleUrls: ['./topup-crypto.component.css']
})
export class TopupCryptoComponent implements OnInit {



  topup = false;

  fiatTopup = false;


  // users trade balance in euro
  cryptoTradeBalanceInEuro = 0.0;


  topUpCryptoCurrentRate = 0;


  // convert crypto to euro
  cryptoToEuro: any;


  // for how much cost with fee
  cryptoWithFee = 0;

  disableButton = false;

  currencyName = 'EURO';
  imagePath = '../../../../assets/images/top-up.png';

  currencyExchangeRate = 0.0;
  convertPrice = 1.0;

  creditEuro = {};

  bankAccount: any;


  logo: string;
  currencyId: string;
  balance: number;
  symbol: string;
  title: string;
  type: string;


  gatewayURL: any;

  // top up fiat form account
  fiatTopupForm = new FormGroup({
    fiatAmount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
  });




  // crypto trade form
  cryptoTradeForm = new FormGroup({
    topUpamount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    cryptoValueInEuro: new FormControl(''),
    cryptoCurrentPrice: new FormControl(''),
    transactionFee: new FormControl(''),
    currencyId: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    symbol: new FormControl('', [Validators.required])
  });


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private topupDailogRef: MatDialogRef<TopupCryptoComponent>,
    private snackBar: MatSnackBar,
    private fiatService: FiatService,
    private bankService: BankAccountService,
    private translate: TranslateService,
    private currencyService: CurrencyService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.translate.setDefaultLang('en');
    if (data) {
      if (data.topup) {
        this.topup = data.topup;
        this.balance = data.balance;
        this.currencyId = data.currencyId;
        this.logo = data.logo;
        this.symbol = data.symbol;
        this.type = data.type;
      }

      if (data.fiatTopup) {
        this.fiatTopup = data.fiatTopup;
        this.logo = data.serverURL + data.data.logo;
        this.currencyId = data.data.currencyId;
        this.type = data.data.type;
        this.symbol = data.data.symbol;
        this.title = data.data.title;
      }
    }
  }


  ngOnInit() {
    if (this.topup) {
    } else {
      this.bankService.getBankAccount().subscribe((bank) => {
        if (bank) {
          this.bankAccount = bank;
        }
      }, error => {
        this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        this.disableButton = false;
      });
    }
  }











  // getting controls of topup fiat form validation
  get fiatControl() { return this.fiatTopupForm.controls; }


  // getting controls of send crypto for trade form validation
  get topupCryptoControl() { return this.cryptoTradeForm.controls; }



  // converting value of tether into euro
  convertCryptoToEuro(value: number) {
    this.cryptoTradeForm.patchValue({ currencyId: this.currencyId });
    this.cryptoTradeForm.patchValue({ type: this.type });
    this.cryptoTradeForm.patchValue({ symbol: this.symbol });
    this.cryptoTradeForm.patchValue({ cryptoCurrentPrice: this.topUpCryptoCurrentRate });
    if (value[0] === '.') {
      const newValue = `0${value}`;
      this.cryptoTradeForm.patchValue({ topUpamount: newValue });
    }
    this.cryptoToEuro = value * this.topUpCryptoCurrentRate;
    // this.cryptoWithFee = Number(value) + (Number(value) * Number(this.ltcFee));
  }






  // transfer bitcoin for trading
  transferCryptoForTrade() {
    this.disableButton = true;
    if (this.cryptoTradeForm.invalid) {
      return false;
    } else {
      this.currencyService.topUpCryptoForTrade(this.cryptoTradeForm.value).subscribe((result) => {
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.disableButton = false;
        }
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.disableButton = false;
        }
      });
    }
  }


  getCurrencyType(value: any, amount: any) {
    this.currencyName = value.innerHTML;
    let converesion = {};
    if (amount < 25) {
      this.snackBar.open
        ('Amount must be 25 or greter then 25', 'X', { duration: 4000, panelClass: ['warning-snackbar'], horizontalPosition: 'end' });
    } else {
      if (value.innerHTML === 'CNY' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/cny.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 156
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      } else if (value.innerHTML === 'RUB' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/rub.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 643
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      } else if (value.innerHTML === 'JPY' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/jpy.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 392
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      } else if (value.innerHTML === 'AED' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/aed.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 784
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      } else if (value.innerHTML === 'TRY' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/try.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 949
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      } else if (value.innerHTML === 'IRR' && amount >= 25) {
        this.imagePath = '../../../../../assets/images/currency-icons/irr.png';
        converesion = {
          fromCurrency: 978,
          toCurrency: 364
        };
        this.getExchangeRate(converesion, amount, this.currencyName);
      }
    }
  }


  getExchangeRate(converesion, amount, currencyName) {
    this.fiatService.getExchangeRate(converesion).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open
          (result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      } else {
        this.currencyExchangeRate = result.rate;
        this.convertPrice = amount * this.currencyExchangeRate;
        this.creditEuro = {
          accountNo: '',
          cardNo: '',
          currency: currencyName,
          currencyCode: converesion.toCurrency,
          fromCurrency: converesion.fromCurrency,
          toCurrency: converesion.toCurrency,
          currencyRate: this.currencyExchangeRate,
          currentprice: this.convertPrice,
          fixedprice: 25,
          paymentmethod: currencyName,
          quantity: amount,
          rialAccountStatus: 'false',
          symbol: this.symbol,
          currencyId: this.currencyId,
          type: this.type,
          title: this.title
        };
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      this.disableButton = false;
    });
  }



  creditAmount() {
    if (this.fiatTopupForm.invalid) {
      return false;
    } else {
      this.fiatService.topUpEuro(this.creditEuro).subscribe((result) => {
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.disableButton = false;
        }
        if (result.success === true) {
          this.gatewayURL = `https://gate.yekpay.com/api/payment/start/${result.data.Authority}`;
          this.sendDataToConfirmationPage(this.creditEuro, this.gatewayURL);
        }
      });
    }
  }


  sendDataToConfirmationPage(data, url) {
    const paymnetData = {
      orderData: data,
      URL: url
    };
    this.topupDailogRef.close();
    this.router.navigateByUrl('/orderConfirmation');
    this.fiatService.setpreviewdata(paymnetData);
  }


  // closing the sending crypto dialog
  closeDilaog() {
    this.topupDailogRef.close();
  }
}
