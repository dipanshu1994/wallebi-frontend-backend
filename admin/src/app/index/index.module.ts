import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CustomMaterialModule } from '../material.module';

import { IndexRoutingModule } from './index-routing.module';

import { LoginComponent } from './login/login.component';
import {FlexLayoutModule} from '@angular/flex-layout';


@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    CommonModule,
    IndexRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CustomMaterialModule,
    FlexLayoutModule
  ],
  providers: [],
})
export class IndexModule { }
