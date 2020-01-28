import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { HomeComponent } from './home/home.component';
import { IndexComponent } from './index/index.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { NotAuthGuard } from '../guards/not-auth.guard';


// routing for index module
const routes: Routes = [
  {path: 'index', component: IndexComponent, canActivate: [NotAuthGuard] },
  { path: 'forgot-password', component: ForgetPasswordComponent, canActivate: [NotAuthGuard] },
  { path: 'emailVerification', component: HomeComponent, canActivate: [NotAuthGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [NotAuthGuard] },
  { path: 'signup/:referalCode', component: HomeComponent, canActivate: [NotAuthGuard] },
  { path: 'deviceVerification', component: HomeComponent, canActivate: [NotAuthGuard] }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexRoutingModule { }
