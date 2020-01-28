import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogConfig, MatDialog, MatSnackBar, MatTableDataSource, PageEvent } from '@angular/material';
import { ApiService } from 'src/app/services/api.service';
import { TopupCryptoComponent } from '../topup-crypto/topup-crypto.component';
import { WithdrawCryptoComponent } from '../withdraw-crypto/withdraw-crypto.component';
import { UserTradeTransaction } from 'src/app/_interface/tradeTransaction.interface';
import { TranslateService } from '@ngx-translate/core';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import { CurrencyService } from 'src/app/services/currency.service';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-trade-currencies',
  templateUrl: './trade-currencies.component.html',
  styleUrls: ['./trade-currencies.component.css']
})
export class TradeCurrenciesComponent implements OnInit {


  options: object;

  displayedColumns: string[] = ['currencyType', 'type', 'amount', 'date'];
  displayColumnsFiat: string[] = ['type', 'trxType', 'currency', 'amount', 'status', 'createdDate'];

  cryptoCoinDataSource = new MatTableDataSource<UserTradeTransaction>();

  fiatDataSource = new MatTableDataSource<any>();



  // current exchange rate
  bitCoinCurrentRate = 0;
  ethCurrentRate = 0;
  tetherCurrentRate = 0;
  ltcCurrentRate = 0;
  moneroCurrentRate = 0;
  bchCurrentRate = 0;
  rippleCurrentRate = 0;
  stellarCurrentRate = 0;

  // exchange parcentage of crypto
  exchangeRateBitCoin = 0;
  exchangeRateEth = 0;
  exchangeRateTether = 0;
  exchangeRateLiteCoin = 0;
  exchangeRateMonero = 0;
  exchangeRateBitCash = 0;
  exchangeRateRipple = 0;
  exchangeRateStaller = 0;



  topupCryptoDialog: MatDialogRef<TopupCryptoComponent>;
  withdrawCryptoDialog: MatDialogRef<WithdrawCryptoComponent>;
  dialogConfig = new MatDialogConfig();




  tradeCurrency: any;

  fiatCurrency: any;

  serverURL: any;


  search = undefined;

  limitCoin = 5;



  pageIndex = 0;
  pageLimit = [5, 10, 15];

  symbol: any;

  totalLengthCoinTrx = 0;
  totalLengthFiat = 0;

  user: any;
  userVerified = false;

  expansionIndex: any;

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private currencyService: CurrencyService,
    private socketService: SocketService,
    private userService: UsersService
  ) {
    this.initateSocket();
    this.serverURL = environment.currencyImage;
    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    this.gettingUserProfile();
    this.apiService.exchangeRate().subscribe((exgRate) => {
      if (exgRate) {
        for (const i in exgRate.data) {
          if (exgRate.data[i].name === 'Bitcoin') {
            this.exchangeRateBitCoin = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.bitCoinCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Ethereum') {
            this.exchangeRateEth = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.ethCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Tether') {
            this.exchangeRateTether = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.tetherCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Litecoin') {
            this.exchangeRateLiteCoin = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.ltcCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Monero') {
            this.exchangeRateMonero = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.moneroCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Bitcoin Cash') {
            this.exchangeRateBitCash = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.bchCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'XRP') {
            this.exchangeRateRipple = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.rippleCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Stellar') {
            this.exchangeRateStaller = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.stellarCurrentRate = exgRate.data[i].quotes.EUR.price;
          }
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });


    this.options = {
      credits: {
        enabled: false
      },
      xAxis: {
        labels: {
          enabled: false
        },
        visible: false,

      },

      yAxis: {
        gridLineColor: 'transparent',
        title: {
          text: null
        },
        labels: {
          enabled: false
        }
      },
      chart: {
        type: 'spline',
        backgroundColor: 'transparent',
        scrollablePlotArea: {
          maxWidth: 200,
          scrollPositionX: 1
        }
      },
      tooltip: {
        valueSuffix: '',
        split: false
      },
      legend: {
        enabled: false
      },
      title: { text: null },
      plotOptions: {
        spline: {
          lineWidth: 1,
          marker: {
            enabled: false
          },
          pointStart: null
        }
      },
      series: [{
        data: [10.4, 10.7, 11.3, 10.2, 9.6, 10.2, 11.1, 10.8, 13.0, 12.5, 12.5, 11.3,
          10.1],
      }]
    };

    this.tradeCurrencies();
    this.fiatCurrencies();
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



  initateSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketService.onSendReceiveTrade(this.user.id).subscribe((data) => {
      if (data) {
        this.socketService.updatedDataSelection(data.balance);
        this.userTradeTransactions(data.symbol);
        this.tradeCurrencies();
        this.expansionIndex = this.tradeCurrency.findIndex((item) => item.symbol === data.symbol);
      }
    });
  }

  // displaying user trade wallet
  tradeCurrencies() {
    this.currencyService.displayTradeWallet().subscribe((currencies) => {
      if (currencies) {
        this.tradeCurrency = currencies;
      }
    });
  }

  // getting and displaying fiat wallet for user
  fiatCurrencies() {
    this.currencyService.displayFiatWalletForUser().subscribe((fiatWallet) => {
      if (fiatWallet) {
        this.fiatCurrency = fiatWallet;
      }
    });
  }


  // opening model for topup crypto
  openTopUpDialog(item: any) {
    this.topupCryptoDialog = this.dialog.open(TopupCryptoComponent, {
      height: 'auto',
      width: '450px',
      data: this.dialogConfig.data = {
        topup: true,
        symbol: item.symbol,
        logo: this.serverURL + item.logo,
        balance: item.tradeWallets.balance,
        title: item.title,
        currencyId: item.currencyId,
        type: item.type
      }
    });
  }

  // opening model for withdraw crypto
  openWithdrawDilaog(item: any) {
    this.withdrawCryptoDialog = this.dialog.open(WithdrawCryptoComponent, {
      height: 'auto',
      width: '450px',
      disableClose: true,
      data: this.dialogConfig.data = {
        withdraw: true,
        symbol: item.symbol,
        logo: this.serverURL + item.logo,
        balance: item.tradeWallets.balance,
        title: item.title,
        currencyId: item.currencyId,
        type: item.type
      }
    });
  }


  // getting user trade transactions
  userTradeTransactions(symbol: any) {
    this.cryptoTradeTransactions(symbol);
  }


  // function for getting trade transaction
  cryptoTradeTransactions(symbol: any) {
    this.symbol = symbol;
    this.currencyService.userCryptoTradeTransaction(symbol, this.pageIndex, this.limitCoin, this.search).subscribe((result) => {
      if (result) {
        this.cryptoCoinDataSource = result.transactions;
        this.totalLengthCoinTrx = result.count;
      }
    });
  }

  // searching in transaction
  searchInCrypto(value: any) {
    this.search = value;
    this.cryptoTradeTransactions(this.symbol);
  }

  // change limit and previous next button in transaction
  getCryptoTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitCoin = event.pageSize;
    this.cryptoTradeTransactions(this.symbol);
  }


  // opening user fiat currnecy expansion panel
  userFiatTransactions(symbol: any) {
    this.fiatTransactions(symbol);
  }


  // fetching fiat transactions from the database
  fiatTransactions(symbol: any) {
    this.symbol = symbol;
    this.currencyService.userFiatTransaction(this.symbol, this.pageIndex, this.limitCoin, this.search).subscribe((fiat) => {
      if (fiat) {
        this.fiatDataSource = fiat.transactions;
        this.totalLengthFiat = fiat.count;
      }
    });
  }


  // searching in fiat transactions
  searchInFiat(value: any) {
    this.search = value;
    this.fiatTransactions(this.symbol);
  }




  // getting fiat transaction on change page change events
  getFiatTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitCoin = event.pageSize;
    this.fiatTransactions(this.symbol);
  }



  openFiatTopUp(item: any) {
    if (this.userVerified === false) {
      this.snackBar.open('Your KYC is not verified!', 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    } else {
      this.topupCryptoDialog = this.dialog.open(TopupCryptoComponent, {
        height: 'auto',
        width: '450px',
        data: this.dialogConfig.data = {
          fiatTopup: true,
          data: item,
          serverURL: this.serverURL
        }
      });
    }
  }



  openFiatWithdraw(item: any) {
    console.log(item);
  }

}
