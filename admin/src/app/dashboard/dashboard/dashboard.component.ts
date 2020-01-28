import { Component, OnInit } from '@angular/core';
import { AdminWalletService } from 'src/app/services/admin-wallet.service';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private adminWallet: AdminWalletService,
    private adminServie: AdminService
  ) { }

  ngOnInit() {
    this.adminWalletGenrate();
    this.adminTokenActivate();
    this.genrateFiatWallet();
  }


  adminTokenActivate() {
    this.adminWallet.updatingEthereumInToken().subscribe((result) => {
      if (result) {
      }
    });
  }


  adminWalletGenrate() {
    this.adminServie.walletGenrating().subscribe((result) => {
      // console.log(result);
    });
  }


  genrateFiatWallet() {
    this.adminWallet.genrateAdminFiatWallet().subscribe((fiat) => {
      if (fiat) {
      }
    });
  }


}
