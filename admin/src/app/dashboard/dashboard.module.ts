import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from '../material.module';
import { LayoutComponent } from './layout/layout.component';

import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ViewCustomersComponent } from './Manage Customers/view-customers/view-customers.component';
import { DetailViewCustomerComponent } from './Manage Customers/detail-view-customer/detail-view-customer.component';
import { DialogComponent } from './dialog/dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
import { ManageCryptoComponent } from './Manage Crypto & Tokens/manage-crypto/manage-crypto.component';
import { EmailTemplateListComponent } from './Manage Email Template/email-template-list/email-template-list.component';
import { AddEmailTemplateComponent } from './Manage Email Template/add-email-template/add-email-template.component';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';

import { NgInputFileModule } from 'ng-input-file';
import { AddCryptoComponent } from './Manage Crypto & Tokens/add-crypto/add-crypto.component';
import { PrivateWalletsComponent } from './Admin Wallets/Main Wallets/private-wallets/private-wallets.component';
// import { TradeWalletsComponent } from './Admin Wallets/Trade Wallets/trade-wallets/trade-wallets.component';
import { SendCryptoComponent } from './Admin Wallets/Main Wallets/send-crypto/send-crypto.component';
import { ReceiveCryptoComponent } from './Admin Wallets/Main Wallets/receive-crypto/receive-crypto.component';
import { ConfirmationPopoverModule } from 'angular-confirmation-popover';
import { LiquidityProviderComponent } from './Settings/liquidity-provider/liquidity-provider.component';
import { PairFeeComponent } from './Settings/pair-fee/pair-fee.component';
import { ProvidersPairFeeComponent } from './Settings/providers-pair-fee/providers-pair-fee.component';
import { FiatWalletComponent } from './Admin Wallets/fiat-wallet/fiat-wallet.component';



@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    ViewCustomersComponent,
    DetailViewCustomerComponent,
    DialogComponent,
    ManageCryptoComponent,
    EmailTemplateListComponent,
    AddEmailTemplateComponent,
    AddCryptoComponent,
    PrivateWalletsComponent,
    // TradeWalletsComponent,
    SendCryptoComponent,
    ReceiveCryptoComponent,
    LiquidityProviderComponent,
    PairFeeComponent,
    ProvidersPairFeeComponent,
    FiatWalletComponent,

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomMaterialModule,
    DashboardRoutingModule,
    QRCodeModule,
    RichTextEditorAllModule,
    NgInputFileModule,
    ConfirmationPopoverModule.forRoot({
      confirmButtonType: 'danger' // set defaults here
    })
  ],
  providers: [
  ],
  entryComponents: [
    DialogComponent,
    SendCryptoComponent,
    ReceiveCryptoComponent
  ]
})
export class DashboardModule { }
