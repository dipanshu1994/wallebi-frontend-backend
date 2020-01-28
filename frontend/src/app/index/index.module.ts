import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { CustomMaterialModule } from '../material.module';

import { IndexRoutingModule } from './index-routing.module';

import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { HomeComponent } from './home/home.component';
import { IndexComponent } from './index/index.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChartAllModule, AccumulationChartAllModule, RangeNavigatorAllModule } from '@syncfusion/ej2-angular-charts';
import { TopNavComponent } from './nav/top-nav/top-nav.component';
import { SideNavComponent } from './nav/side-nav/side-nav.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RecaptchaModule, RecaptchaSettings, RECAPTCHA_SETTINGS } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ForgetPasswordComponent,
    HomeComponent,
    IndexComponent,
    ResetPasswordComponent,
    TopNavComponent,
    SideNavComponent
  ],
  imports: [
    CommonModule,
    IndexRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CustomMaterialModule,
    ChartAllModule,
    AccumulationChartAllModule,
    RangeNavigatorAllModule,
    FlexLayoutModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    RecaptchaModule
  ],
  providers: [
    { provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.recaptchaKey } as RecaptchaSettings
    },
  ],
  entryComponents: [LoginComponent, RegisterComponent]
})
export class IndexModule { }
