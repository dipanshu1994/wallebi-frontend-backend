import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogComponent } from 'src/app/dashboard/dialog/dialog.component';

@Component({
  selector: 'app-send-crypto',
  templateUrl: './send-crypto.component.html',
  styleUrls: ['./send-crypto.component.css']
})
export class SendCryptoComponent implements OnInit {

  sendBitcoin = false;
  sendEthereum = false;
  sendTether = false;
  sendLitecoin = false;
  sendMonero = false;
  sendBitcash = false;
  sendRipple = false; 
  sendStellar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private qrDailogRef: MatDialogRef<DialogComponent>

  ) {
    if (data) {
      this.sendBitcoin = data.sendBitcoin;
      this.sendEthereum = data.sendEthereum;
      this.sendTether = data.sendTether;
      this.sendLitecoin = data.sendLitecoin;
      this.sendMonero = data.sendMonero;
      this.sendBitcash = data.sendBitcash;
      this.sendRipple = data.sendRipple;
      this.sendStellar = data.sendStellar;
    }
  }

  ngOnInit() {
  }
  closeDilaog() {
    this.qrDailogRef.close();
  }

}
