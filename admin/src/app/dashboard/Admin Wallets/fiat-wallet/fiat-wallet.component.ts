import { Component, OnInit } from '@angular/core';
import { AdminWalletService } from 'src/app/services/admin-wallet.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-fiat-wallet',
  templateUrl: './fiat-wallet.component.html',
  styleUrls: ['./fiat-wallet.component.css']
})
export class FiatWalletComponent implements OnInit {

  adminFiat: any;

  serverUrl: any;

  constructor(
    private adminWallet: AdminWalletService
  ) {
    this.serverUrl = environment.currencyImage;
  }

  ngOnInit() {
    this.adminFiatWallet();
  }


  adminFiatWallet() {
    this.adminWallet.fetchAdminFiatWallet().subscribe((adminFiat) => {
      // console.log(adminFiat);
      this.adminFiat = adminFiat;
    });
  }

}
