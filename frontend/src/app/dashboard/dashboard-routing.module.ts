import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '../guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

import { DashboardComponent } from './Accounts/dashboard/dashboard.component';
import { ProfileComponent } from './Accounts/profile/profile.component';
import { UserKycVerificationComponent } from './Accounts/user-kyc-verification/user-kyc-verification.component';
import { UserSecurityComponent } from './Accounts/user-security/user-security.component';
import { BankAccountComponent } from './Accounts/bank-account/bank-account.component';
import { UserRefferalComponent } from './Accounts/user-refferal/user-refferal.component';
import { EWalletCryptoComponent } from './E-Wallets/SendorReceiveCrypto/e-wallet-crypto/e-wallet-crypto.component';
import { TradeCurrenciesComponent } from './E-Wallets/TradeCrypto/trade-currencies/trade-currencies.component';
import { BuySellComponent } from './E-Wallets/TradeCrypto/buy-sell/buy-sell.component';

// dashboard routing after user successfull login
const routes: Routes = [
  {
    path: '', component: LayoutComponent, canActivate: [AuthGuard], children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'kyc-verification', component: UserKycVerificationComponent },
      { path: 'user-security', component: UserSecurityComponent },
      { path: 'bank-account', component: BankAccountComponent },
      { path: 'user-referral', component: UserRefferalComponent },
      { path: 'e-walletCrypto', component: EWalletCryptoComponent },
      { path: 'tradeCrypto', component: TradeCurrenciesComponent},
      { path: 'buy-sell', component: BuySellComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
