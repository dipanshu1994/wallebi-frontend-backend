import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { DialogComponent } from 'src/app/dashboard/dialog/dialog.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-receive-crypto',
  templateUrl: './receive-crypto.component.html',
  styleUrls: ['./receive-crypto.component.css']
})
export class ReceiveCryptoComponent implements OnInit {

  receive = false;
  logo: string;
  serverURL: string;
  title: string;
  symbol: string;
  contract: string;

  receiverAddress: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private receiveDailogRef: MatDialogRef<ReceiveCryptoComponent>,
    private snackBar: MatSnackBar,
  ) {
    this.serverURL = environment.currencyImage;
    if (data) {


      // receive crypto
      this.receive = data.receive;
      this.logo = this.serverURL + data.logos;
      this.receiverAddress = data.addresss;
      this.title = data.titles;
      this.symbol = data.symbols;
      this.contract = data.contracts;
    }
  }

  ngOnInit() {
  }

  copyAddress(address: any) {
    const el = document.createElement('textarea');
    el.value = address;
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.snackBar.open
      ('Your address copied successfully!', 'X', { duration: 3000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
  }

  printAddress() {
    window.print();
  }

  shareOnGmail() {
    const mailSubject = `My ${this.title} address`;
    let url = '';
    url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&source=mailto&su=${mailSubject}&body=${this.receiverAddress}`;
    window.open(url, '_blank');
  }

  connectToExplorer(address: any) {
    let url = '';
    if (this.symbol === 'BTC') {
      url = `https://www.blockchain.com/btc/address/${address}`;
    }
    if (this.symbol === 'ETH') {
      url = `https://etherscan.io/address/${address}`;
    }
    if (this.symbol === 'USDT') {
      url = `https://omniexplorer.info/address/${address}`;
    }
    if (this.symbol === 'LTC') {
      url = `https://chain.so/address/LTC/${address}`;
    }
    if (this.symbol === 'XMR') {
      url = `https://monerohash.com/explorer/search?value=${address}`;
    }
    if (this.symbol === 'BCH') {
      url = `https://explorer.bitcoin.com/bch/address/${address}`;
    }
    if (this.symbol === 'XRP') {
      url = `https://bithomp.com/explorer/${address}`;
    }
    if (this.symbol === 'XLM') {
      url = `https://stellarchain.io/address/${address}`;
    }
    if (this.contract) {
      url = `https://etherscan.io/token/${this.contract}?a=${address}`;
    }
    window.open(url, '_blank');
  }




  closeDilaog() {
    this.receiveDailogRef.close();
  }
}
