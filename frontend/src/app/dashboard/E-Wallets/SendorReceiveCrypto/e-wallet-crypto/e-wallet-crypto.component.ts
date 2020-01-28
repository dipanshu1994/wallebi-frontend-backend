import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import {
  MatPaginator,
  MatTableDataSource,
  MatSort,
  MatSnackBar,
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  PageEvent
} from '@angular/material';
import { ReferralSystem } from 'src/app/_interface/referralUser.interface.';
import { ApiService } from 'src/app/services/api.service';
import { routerTransitionRight, slideToLeft, shakeAnimate } from 'src/app/app.animation';
import { UserTransaction } from 'src/app/_interface/transaction.interface';
import { ReceiverCryptoComponent } from '../receiver-crypto/receiver-crypto.component';
import { SendCryptoComponent } from '../send-crypto/send-crypto.component';
import { PusherService } from 'src/app/services/pusher.service';
import { TranslateService } from '@ngx-translate/core';
import { UsersService } from 'src/app/services/users.service';
import { environment } from '../../../../../environments/environment';
import { CurrencyService } from 'src/app/services/currency.service';
import { SocketService } from 'src/app/services/socket.service';

const ELEMENT_DATA: ReferralSystem[] = [
  { dateTime: '01/10/2019', name: 'Shubham Tyagi', email: 'shtyagi@lapits.com', status: 'Pending', statusPaidOut: 'Send' }

];

@Component({
  selector: 'app-e-wallet-crypto',
  templateUrl: './e-wallet-crypto.component.html',
  styleUrls: ['./e-wallet-crypto.component.css'],
  animations: [
    routerTransitionRight,
    slideToLeft,
    shakeAnimate
  ]
})



export class EWalletCryptoComponent implements OnInit, OnDestroy {

  serverURL: string;

  displayedColumns: string[] = ['currencyType', 'receiverAddress', 'amount', 'timestamp', 'trnxFee', 'hash', 'action'];

  coinTransactionDataSource = new MatTableDataSource<UserTransaction>();





  options: object;

  sendCryptoDialog: MatDialogRef<SendCryptoComponent>;
  receiveCryptoDialog: MatDialogRef<ReceiverCryptoComponent>;

  dialogConfig = new MatDialogConfig();

  // exchange parcentage of crypto
  exchangeRateBitCoin = 0;
  exchangeRateEth = 0;
  exchangeRateTether = 0;
  exchangeRateLiteCoin = 0;
  exchangeRateMonero = 0;
  exchangeRateBitCash = 0;
  exchangeRateRipple = 0;
  exchangeRateStaller = 0;
  exchangeRateMaker = 0;
  exchangeRateTrueUSD = 0;
  exchangeRateOmiseGo = 0;
  exchangeRateZilliqa = 0;
  exchangeRateBasicAttention = 0;
  exchangeRateHolo = 0;



  // current exchange rate
  bitCoinCurrentRate = 0;
  ethCurrentRate = 0;
  tetherCurrentRate = 0;
  ltcCurrentRate = 0;
  moneroCurrentRate = 0;
  bchCurrentRate = 0;
  rippleCurrentRate = 0;
  stellarCurrentRate = 0;
  makerCurrentRate = 0;
  tusdCurrentRate = 0;
  omgCurrentRate = 0;
  zilCurrentRate = 0;
  batCurrentRate = 0;
  hotCurrentRate = 0;




  // user balance in euro
  btcToEuro = 0;
  ethToEuro = 0;
  tetherToEuro = 0;
  ltcToEuro = 0;
  bitcashToEuro = 0;
  moneroToEuro = 0;
  rippleToEuro = 0;
  stellarToEuro = 0;
  makerToEuro = 0;
  tusdToEuro = 0;
  omgToEuro = 0;
  zilToEuro = 0;
  batToEuro = 0;
  hotToEuro = 0;




  search = undefined;

  limitCoin = 5;



  pageIndex = 0;
  pageLimit = [5, 10, 15];


  totalLengthCoinTrx = 0;

  user: any;


  @ViewChild(MatSort) sort: MatSort;


  currencies: any;
  wallets: any;
  walletsLength = 0;

  symbol = 'BTC';

  expansionIndex: any;

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private translate: TranslateService,
    private userService: UsersService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private socketService: SocketService
  ) {
    this.initateSocket();
    this.serverURL = environment.currencyImage;
    this.translate.setDefaultLang('en');
  }


  ngOnInit() {

    this.getCurrencies();
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
          } else if (exgRate.data[i].name === 'Maker') {
            this.exchangeRateMaker = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.makerCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'TrueUSD') {
            this.exchangeRateTrueUSD = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.tusdCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'OmiseGO') {
            this.exchangeRateOmiseGo = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.omgCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Zilliqa') {
            this.exchangeRateZilliqa = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.zilCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Basic Attention Token') {
            this.exchangeRateBasicAttention = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.batCurrentRate = exgRate.data[i].quotes.EUR.price;
          } else if (exgRate.data[i].name === 'Holo') {
            this.exchangeRateHolo = exgRate.data[i].quotes.EUR.percent_change_1h;
            this.hotCurrentRate = exgRate.data[i].quotes.EUR.price;
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
    this.user = this.apiService.getUserDetails();
  }



  initateSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketService.onSendReceive(this.user.id).subscribe((data) => {
      if (data) {
        // console.log(data);
        this.socketService.updatedDataSelection(data.balance);
        this.cryptoTransactions(data.symbol);
        this.checkingTransactions(data.symbol);
        this.getCurrencies();
        this.expansionIndex = this.currencies.findIndex((item) => item.symbol === data.symbol);
      }
    });


    this.socketService.onNewWallet().subscribe((wallet) => {
      if (wallet) {
        this.genrateWalletSocket();
        setTimeout(() => {
          this.getCurrencies();
        }, 15000);
      }
    });
  }



  genrateWalletSocket() {
    this.currencyService.genratWallet().subscribe((result) => {
      // console.log(result);
    });
    setTimeout(() => {
      this.currencyService.updateEtherInToken().subscribe((result) => {
        if (result) {
          // console.log(result);
        }
      });
    }, 5000);
  }

  // activating user wallet
  activateCrypto(currencyIds: any, types: any, symbols: any, titles: any) {
    const wallet = {
      currencyId: currencyIds,
      type: types,
      symbol: symbols,
      title: titles
    };
    this.currencyService.activateWallet(wallet).subscribe((result) => {
      if (result) {
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.getCurrencies();
        }
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['erroe-snackbar'], horizontalPosition: 'end' });
        }
      }
    });
  }



  // getting all currencies for user
  getCurrencies() {
    this.currencyService.getAllCurrencies().subscribe((currencies) => {
      if (currencies) {
        this.currencies = currencies;
      }
    });
  }


  // opening dialog box for sending crypto to other
  openSendDialog(symbol: any, logo: any, balance: any, address: any, title: any, contract: any, currencyIds: any, types: any) {
    this.sendCryptoDialog = this.dialog.open(SendCryptoComponent, {
      height: 'auto',
      width: '450px',
      disableClose: true,
      data: this.dialogConfig.data = {
        send: true,
        symbols: symbol,
        logos: logo,
        balances: balance,
        addresss: address,
        titles: title,
        contracts: contract,
        currencyId: currencyIds,
        type: types
      }
    });
  }


  // opening dialog for displaying user QR code
  openReceiveDilaog(symbol: any, logo: any, balance: any, address: any, title: any, contract: any, types: any) {
    this.receiveCryptoDialog = this.dialog.open(ReceiverCryptoComponent, {
      height: 'auto',
      width: '450px',
      disableClose: true,
      data: this.dialogConfig.data = {
        receive: true,
        symbols: symbol,
        logos: logo,
        balances: balance,
        addresss: address,
        titles: title,
        contracts: contract,
        type: types
      }
    });
  }



  // checking particular currency transaction on the basis of openig expaniosn panel
  checkingTransactions(item: any) {
    this.symbol = item.symbol;
    this.cryptoTransactions(this.symbol);
  }



  // function for getting transaction
  cryptoTransactions(symbol: any) {
    this.currencyService.userCryptoTransaction(symbol, this.pageIndex, this.limitCoin, this.search).subscribe((result) => {
      if (result) {
        this.coinTransactionDataSource = result.transactions;
        this.totalLengthCoinTrx = result.count;
      }
    });
  }

  // searching in transaction
  searchInCrypto(value: any) {
    this.search = value;
    this.cryptoTransactions(this.symbol);
  }

  // change limit and previous next button in transaction
  getCryptoTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitCoin = event.pageSize;
    this.cryptoTransactions(this.symbol);
  }


  ngOnDestroy() {
    this.socketService.onSendReceiveUnSubscribe(this.user.id);
  }

}
