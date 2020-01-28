import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS, HttpClientJsonpModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';

import { CookieService } from 'angular2-cookie/services/cookies.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomMaterialModule } from './material.module';
import { MatNativeDateModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material';
import { OTPComponent } from './otp/otp.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgProgressModule, NgProgressInterceptor } from 'ngx-progressbar';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NotFoundComponent } from './not-found/not-found.component';
import { UserIdleModule } from 'angular-user-idle';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { OrderComponent } from './order/order.component';
import { NgxMatIntlTelInputModule } from 'ngx-mat-intl-tel-input';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}



@NgModule({
  declarations: [
    AppComponent,
    OTPComponent,
    NotFoundComponent,
    OrderComponent,

  ],
  imports: [
    BrowserModule,
    MatNativeDateModule,
    BrowserAnimationsModule,
    CustomMaterialModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientJsonpModule,
    LayoutModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: 'never' }),
    FlexLayoutModule,
    FormsModule,
    NgProgressModule,
    NgxMatIntlTelInputModule,
    ImageCropperModule,
    UserIdleModule.forRoot({ idle: 600, timeout: 600, ping: 120 }),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })

  ],
  entryComponents: [OTPComponent],
  providers: [CookieService,
    { provide: HTTP_INTERCEPTORS, useClass: NgProgressInterceptor, multi: true },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 1000 } }
  ],
  exports: [
    TranslateModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
