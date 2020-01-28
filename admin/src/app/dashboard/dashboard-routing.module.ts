import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '../guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ViewCustomersComponent } from './Manage Customers/view-customers/view-customers.component';
import { DetailViewCustomerComponent } from './Manage Customers/detail-view-customer/detail-view-customer.component';
import { ManageCryptoComponent } from './Manage Crypto & Tokens/manage-crypto/manage-crypto.component';
import { EmailTemplateListComponent } from './Manage Email Template/email-template-list/email-template-list.component';
import { AddEmailTemplateComponent } from './Manage Email Template/add-email-template/add-email-template.component';
import { AddCryptoComponent } from './Manage Crypto & Tokens/add-crypto/add-crypto.component';
import { PrivateWalletsComponent } from './Admin Wallets/Main Wallets/private-wallets/private-wallets.component';
import { LiquidityProviderComponent } from './Settings/liquidity-provider/liquidity-provider.component';
import { PairFeeComponent } from './Settings/pair-fee/pair-fee.component';
import { ProvidersPairFeeComponent } from './Settings/providers-pair-fee/providers-pair-fee.component';
import { FiatWalletComponent } from './Admin Wallets/fiat-wallet/fiat-wallet.component';
// import { TradeWalletsComponent } from './Admin Wallets/Trade Wallets/trade-wallets/trade-wallets.component';

// dashboard routing after admin successfull login
const routes: Routes = [
  {
    path: '', component: LayoutComponent, canActivate: [AuthGuard], children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'view-customers', component: ViewCustomersComponent },
      { path: 'customerDetails/:id', component: DetailViewCustomerComponent },
      { path: 'view-currencies', component: ManageCryptoComponent },
      { path: 'template-list', component: EmailTemplateListComponent },
      { path: 'new-email-template', component: AddEmailTemplateComponent },
      { path: 'add-crypto', component: AddCryptoComponent },
      { path: 'main-wallets', component: PrivateWalletsComponent },
      { path: 'editTemplate/:templateId', component: AddEmailTemplateComponent },
      { path: 'liquidity-providers', component: LiquidityProviderComponent },
      { path: 'add-providers-fee', component: PairFeeComponent },
      { path: 'pair-fee', component: ProvidersPairFeeComponent },
      { path: 'editPairDetails/:pairId', component: PairFeeComponent },
      { path: 'fiat-wallet', component: FiatWalletComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
