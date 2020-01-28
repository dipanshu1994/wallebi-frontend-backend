import { Component, OnInit } from '@angular/core';
import { CurrencyService } from 'src/app/services/currency.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material';
import { UsersService } from 'src/app/services/users.service';
import { SocketService } from 'src/app/services/socket.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-buy-sell',
  templateUrl: './buy-sell.component.html',
  styleUrls: ['./buy-sell.component.css']
})
export class BuySellComponent implements OnInit {

  userVerified = false;

  buyCryptoPrice = 0;
  sellCryptoPrice = 0;

  fiatCurrency: any;
  tradeCurrency: any;

  userCryptoTradeBalance = 0.0;
  userFiatBalance = 0.0;

  serverUrl: any;

  buycryptoImage: any;
  sellcryptoImage: any;

  symbol = 'BTC';

  cryptoAmountInEuro: any = 0;
  cryptoAmountInEuroSell: any = 0;
  euroAmountInCryptoSell: any = 0;
  euroAmountInCrypto: any = 0;

  buyCryptoForm = new FormGroup({
    euroAmount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    cryptoQuantity: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    cryptoCurrencyBuyPrice: new FormControl('', [Validators.required]),
    currencyId: new FormControl('', [Validators.required]),
    symbol: new FormControl('', [Validators.required]),
    pair: new FormControl('', [Validators.required])
  });


  sellCryptoForm = new FormGroup({
    cryptoAmount: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    euroQuantity: new FormControl('', [Validators.required, Validators.pattern('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$')]),
    cryptoToEuroPrice: new FormControl('', [Validators.required]),
    currencyId: new FormControl('', [Validators.required]),
    symbol: new FormControl('', [Validators.required]),
    pair: new FormControl('', [Validators.required])
  });


  user: any;

  constructor(
    private currencyService: CurrencyService,
    private snack: MatSnackBar,
    private userService: UsersService,
    private socketService: SocketService,
    private apiService: ApiService
  ) {
    this.sendReceiveTradeSocket();
    this.fiatSocket();
    this.serverUrl = environment.currencyImage;
    this.buycryptoImage = '../../../../../assets/images/currency-icons/cryptocurrency-icon.png';
    this.sellcryptoImage = '../../../../../assets/images/currency-icons/cryptocurrency-icon.png';
  }

  ngOnInit() {
    this.gettingUserProfile();
    this.fiatCurrencies();
    this.tradeCurrencies();
    this.fetchingExmoPrice(this.symbol);
  }



  sendReceiveTradeSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketService.onBuySellTrade(this.user.id).subscribe((trade) => {
      if (trade) {
        if (trade.transaction) {
          this.userCryptoTradeBalance = trade.transaction.balance;
        }
        this.tradeCurrencies();
        this.fiatCurrencies();
      }
    });
  }


  fiatSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketService.onFiatSocketSubscribe(this.user.id).subscribe((fiat) => {
      if (fiat) {
        this.tradeCurrencies();
        this.fiatCurrencies();
      }
    });
  }


  // getting user profile for enable and disable buy sell for user
  gettingUserProfile() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile.user) {
        if (profile.user.userProfileId) {
          if (profile.user.userProfileId.address_verification === 'verified'
            &&
            profile.user.userProfileId.doc_verification === 'verified'
            &&
            profile.user.userProfileId.doc_verification_back === 'verified'
            &&
            profile.user.userProfileId.selfie_verification === 'verified') {
            this.userVerified = true;
          }
        }
      }
    });
  }



  // getting controls of buy crypto form validation
  get buyCryptoControl() { return this.buyCryptoForm.controls; }


  // getting controls of sell crypto form validation
  get sellCryptoControl() { return this.sellCryptoForm.controls; }


  // getting and displaying fiat balance of user
  fiatCurrencies() {
    this.currencyService.displayFiatWalletForUser().subscribe((fiatWallet) => {
      if (fiatWallet) {
        this.fiatCurrency = fiatWallet;
      }
    });
  }


  // displaying buy sell currency & user trade wallet
  tradeCurrencies() {
    this.currencyService.displayTradeWallet().subscribe((currencies) => {
      if (currencies) {
        // console.log(currencies);
        this.tradeCurrency = currencies;
      }
    });
  }


  // fetching buy details for buying currency
  buyCrypto(item: any) {
    this.symbol = item.symbol;
    this.buyCryptoForm.patchValue({ cryptoCurrencyBuyPrice: this.buyCryptoPrice });
    this.buyCryptoForm.patchValue({ currencyId: item.currencyId });
    this.buyCryptoForm.patchValue({ symbol: this.symbol });
    this.buyCryptoForm.patchValue({ pair: `${this.symbol}_EUR` });
    if (this.symbol === 'BTC') {
      this.buycryptoImage = this.serverUrl + item.logo;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'LTC') {
      this.buycryptoImage = this.serverUrl + item.logo;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'ETH') {
      this.buycryptoImage = this.serverUrl + item.logo;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'USDT') {
      this.buycryptoImage = this.serverUrl + item.logo;
      this.fetchingExmoPrice(this.symbol);
    }
  }

  // fetching sell details for selling currency
  sellCrypto(item: any) {
    this.symbol = item.symbol;
    this.sellCryptoForm.patchValue({ cryptoToEuroPrice: this.sellCryptoPrice });
    this.sellCryptoForm.patchValue({ currencyId: item.currencyId });
    this.sellCryptoForm.patchValue({ symbol: this.symbol });
    this.sellCryptoForm.patchValue({ pair: `${this.symbol}_EUR` });
    if (this.symbol === 'BTC') {
      this.sellcryptoImage = this.serverUrl + item.logo;
      this.userCryptoTradeBalance = item.tradeWallets.balance;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'LTC') {
      this.sellcryptoImage = this.serverUrl + item.logo;
      this.userCryptoTradeBalance = item.tradeWallets.balance;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'ETH') {
      this.sellcryptoImage = this.serverUrl + item.logo;
      this.userCryptoTradeBalance = item.tradeWallets.balance;
      this.fetchingExmoPrice(this.symbol);
    } else if (this.symbol === 'USDT') {
      this.sellcryptoImage = this.serverUrl + item.logo;
      this.userCryptoTradeBalance = item.tradeWallets.balance;
      this.fetchingExmoPrice(this.symbol);
    }
  }


  // fetching price from exmo
  fetchingExmoPrice(cryptoName: any) {
    this.cryptoAmountInEuro = 0;
    this.cryptoAmountInEuroSell = 0;
    this.euroAmountInCryptoSell = 0;
    this.euroAmountInCrypto = 0;
    this.currencyService.exmoPiarBuySellPrice().subscribe((pairPrice) => {
      if (pairPrice) {
        if (cryptoName === 'BTC') {
          this.buyCryptoPrice = pairPrice.BTC_EUR.buy_price;
          this.sellCryptoPrice = pairPrice.BTC_EUR.sell_price;
        } else if (cryptoName === 'ETH') {
          this.buyCryptoPrice = pairPrice.ETH_EUR.buy_price;
          this.sellCryptoPrice = pairPrice.ETH_EUR.sell_price;
        } else if (cryptoName === 'LTC') {
          this.buyCryptoPrice = pairPrice.LTC_EUR.buy_price;
          this.sellCryptoPrice = pairPrice.LTC_EUR.sell_price;
        } else if (cryptoName === 'USDT') {
          this.buyCryptoPrice = pairPrice.USDT_EUR.buy_price;
          this.sellCryptoPrice = pairPrice.USDT_EUR.sell_price;
        }
      }
    });
  }


  // converting euro to crypto
  convertEuroToCrypto(value: any) {
    if (value > 10000) {
      this.euroAmountInCrypto = 0;
      this.cryptoAmountInEuro = 0;
      this.snack.open('Amount shold be less then 10000!',
        'X', { duration: 2000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      this.cryptoAmountInEuro = value / this.buyCryptoPrice;
      this.cryptoAmountInEuro = this.cryptoAmountInEuro.toFixed(8);
    }
  }


  // convert euro to crypto
  convertCryptoToEuro(value: any) {
    if (value * this.buyCryptoPrice > 10000) {
      this.euroAmountInCrypto = 0;
      this.cryptoAmountInEuro = 0;
      this.snack.open('Amount shold be less then 10000!',
        'X', { duration: 2000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      this.euroAmountInCrypto = value * this.buyCryptoPrice;
      this.euroAmountInCrypto = this.euroAmountInCrypto.toFixed(8);
    }
  }



  convertCryptoToEuroForSell(value: any) {
    if (value * this.sellCryptoPrice > 10000) {
      this.euroAmountInCryptoSell = 0;
      this.cryptoAmountInEuroSell = 0;
      this.snack.open('Amount shold be less then 10000!',
        'X', { duration: 2000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      this.euroAmountInCryptoSell = value * this.sellCryptoPrice;
      this.euroAmountInCryptoSell = this.euroAmountInCryptoSell.toFixed(8);
    }
  }


  convertEuroToCryptoSell(value: any) {
    if (value > 10000) {
      this.euroAmountInCryptoSell = 0;
      this.cryptoAmountInEuroSell = 0;
      this.snack.open('Amount shold be less then 10000!',
        'X', { duration: 2000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      this.cryptoAmountInEuroSell = value / this.sellCryptoPrice;
      this.cryptoAmountInEuroSell = this.cryptoAmountInEuroSell.toFixed(8);
    }
  }

  // buying crypto from euro
  buyCryptoFromTrade() {
    if (this.userVerified === false) {
      this.snack.open('Your KYC is not verified!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      if (this.buyCryptoForm.controls.currencyId.value === '') {
        this.snack.open('Please choose any currency!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      } else {
        if (this.buyCryptoForm.invalid) {
          return false;
        } else {
          if (this.buyCryptoForm.controls.euroAmount.value <= 0 || this.buyCryptoForm.controls.euroAmount.value < 25) {
            this.snack.open('Euro amount must be 25!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          } else {
            this.currencyService.buyCryptoTrade(this.buyCryptoForm.value).subscribe((buyResult) => {
              if (buyResult) {
                if (buyResult.success === true) {
                  this.snack.open(buyResult.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
                } else {
                  this.snack.open(buyResult.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
                }
              }
            });
          }
        }
      }
    }
  }



  // selling crypto from euro
  sellCryptoFromTrade() {
    if (this.userVerified === false) {
      this.snack.open('Your KYC is not verified!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      if (this.sellCryptoForm.controls.currencyId.value === '') {
        this.snack.open('Please choose any currency!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      } else {
        if (this.sellCryptoForm.invalid) {
          return false;
        } else {
          if (this.sellCryptoForm.controls.euroQuantity.value <= 0 || this.sellCryptoForm.controls.euroQuantity.value < 25) {
            this.snack.open('Euro amount must be 25!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          } else {
            this.currencyService.sellCryptoTrade(this.sellCryptoForm.value).subscribe((sellResult) => {
              if (sellResult) {
                if (sellResult.success === true) {
                  this.snack.open(sellResult.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
                } else {
                  this.snack.open(sellResult.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
                }
              }
            });
          }
        }
      }
    }
  }



}
