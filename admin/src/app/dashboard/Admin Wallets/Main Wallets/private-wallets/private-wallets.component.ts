import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminWalletService } from 'src/app/services/admin-wallet.service';
import { MatSnackBar, MatDialogRef, MatDialog, MatDialogConfig, MatTableDataSource, MatSort, PageEvent } from '@angular/material';
import { SendCryptoComponent } from '../send-crypto/send-crypto.component';
import { ReceiveCryptoComponent } from '../receive-crypto/receive-crypto.component';
import { AdminService } from 'src/app/services/admin.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-private-wallets',
  templateUrl: './private-wallets.component.html',
  styleUrls: ['./private-wallets.component.css']
})
export class PrivateWalletsComponent implements OnInit {

  serverURL: string;

  displayedColumns: string[] = ['currencyType', 'receiverAddress', 'amount', 'timestamp', 'trnxFee', 'hash', 'action'];

  coinTransactionDataSource = new MatTableDataSource();


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


  adminWallet: any;


  symbol: any;
  totalLengthStellar = 0;





  sendCryptoDialog: MatDialogRef<SendCryptoComponent>;
  receiveCryptoDialog: MatDialogRef<ReceiveCryptoComponent>;

  dialogConfig = new MatDialogConfig();


  constructor(
    private walletService: AdminWalletService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private adminService: AdminService,
    private adminWalletService: AdminWalletService
  ) {
    this.serverURL = environment.currencyImage;
  }

  ngOnInit() {
    this.genrateWalletForAdmin();
  }


  genrateWalletForAdmin() {
    this.adminService.displayWallet().subscribe((wallet) => {
      if (wallet) {
        this.adminWallet = wallet;
      }
    });
  }


  activateCrypto(currencyIds: any, types: any, symbols: any, titles: any) {
    const wallet = {
      currencyId: currencyIds,
      type: types,
      symbol: symbols,
      title: titles
    };
    this.walletService.activateCryptoWallet(wallet).subscribe((result) => {
      if (result) {
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.genrateWalletForAdmin();
        }
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['erroe-snackbar'], horizontalPosition: 'end' });
        }
      }
    });
  }


  openReceiveDilaog(symbol: any, logo: any, balance: any, address: any, title: any, contract: any) {
    this.receiveCryptoDialog = this.dialog.open(ReceiveCryptoComponent, {
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
        contracts: contract
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
    this.adminWalletService.getAdminCryptoTransaction(symbol, this.pageIndex, this.limitCoin, this.search).subscribe((result) => {
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




}
