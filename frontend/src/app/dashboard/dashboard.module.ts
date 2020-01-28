import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from '../material.module';
import { LayoutComponent } from './layout/layout.component';

import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from './Accounts/dashboard/dashboard.component';
import { ProfileComponent } from './Accounts/profile/profile.component';
import { UserKycVerificationComponent } from './Accounts/user-kyc-verification/user-kyc-verification.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxMatIntlTelInputModule } from './../../../node_modules/ngx-mat-intl-tel-input';
import { UserSecurityComponent } from './Accounts/user-security/user-security.component';
import { BankAccountComponent } from './Accounts/bank-account/bank-account.component';
import { UserRefferalComponent } from './Accounts/user-refferal/user-refferal.component';
import { EWalletCryptoComponent } from './E-Wallets/SendorReceiveCrypto/e-wallet-crypto/e-wallet-crypto.component';
import { ChartModule } from 'angular2-highcharts';
import { SendCryptoComponent } from './E-Wallets/SendorReceiveCrypto/send-crypto/send-crypto.component';
import { ReceiverCryptoComponent } from './E-Wallets/SendorReceiveCrypto/receiver-crypto/receiver-crypto.component';
import { QRCodeModule } from 'angularx-qrcode';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
import * as highcharts from 'highcharts';
import { TradeCurrenciesComponent } from './E-Wallets/TradeCrypto/trade-currencies/trade-currencies.component';
import { TopupCryptoComponent } from './E-Wallets/TradeCrypto/topup-crypto/topup-crypto.component';
import { WithdrawCryptoComponent } from './E-Wallets/TradeCrypto/withdraw-crypto/withdraw-crypto.component';
import { ExpoToNumberPipe } from '../Pipes/expo-to-number.pipe';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { BuySellComponent } from './E-Wallets/TradeCrypto/buy-sell/buy-sell.component';
import { DecimalpointDirective } from '../decimalpoint.directive';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    ProfileComponent,
    UserKycVerificationComponent,
    UserSecurityComponent,
    BankAccountComponent,
    UserRefferalComponent,
    EWalletCryptoComponent,
    SendCryptoComponent,
    ReceiverCryptoComponent,
    TopupCryptoComponent,
    TradeCurrenciesComponent,
    WithdrawCryptoComponent,
    ExpoToNumberPipe,
    BuySellComponent,
    DecimalpointDirective

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomMaterialModule,
    DashboardRoutingModule,
    NgxMatIntlTelInputModule,
    ChartModule,
    QRCodeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    {
      provide: HighchartsStatic,
      useValue: highcharts
    }
  ],
  entryComponents: [SendCryptoComponent, ReceiverCryptoComponent, TopupCryptoComponent, WithdrawCryptoComponent]
})
export class DashboardModule { }
