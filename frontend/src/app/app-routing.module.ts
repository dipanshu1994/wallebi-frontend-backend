import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { OrderComponent } from './order/order.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  { path: 'login', redirectTo: 'index', pathMatch: 'full' },
  { path: 'register', redirectTo: 'index', pathMatch: 'full' },
  { path: '', loadChildren: '../app/index/index.module#IndexModule' },
  { path: '', loadChildren: '../app/dashboard/dashboard.module#DashboardModule' },
  { path: 'orderStatus', component: OrderComponent, canActivate: [AuthGuard] },
  { path: 'paymentStatus', component: OrderComponent, canActivate: [AuthGuard] },
  { path: 'orderConfirmation', component: OrderComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
