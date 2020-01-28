import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FiatService } from '../services/fiat.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit, OnDestroy {

  authority: any;
  success: any;
  returnSubject: any;
  order = false;
  orderData: any;
  startPayment: any;
  currencyRate: any;
  quantity: any;
  commission: any;

  currentprice: any;


  constructor(
    private activateRoute: ActivatedRoute,
    private fiatService: FiatService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    if (this.activateRoute.snapshot.routeConfig.path === 'yourOrderStatus') {
      this.authority = this.activateRoute.snapshot.queryParamMap.get('authority');
      this.verifyPayment(this.authority);
    }
    if (this.activateRoute.snapshot.routeConfig.path === 'paymentStatus') {
      this.success = this.activateRoute.snapshot.queryParamMap.get('success');
      if (this.success === '0') {
        setTimeout(() => {
          this.router.navigate(['/tradeCrypto']);
        }, 10000);
      }
      if (this.success === '1') {
        setTimeout(() => {
          this.router.navigate(['/tradeCrypto']);
        }, 10000);
      }
    }
    if (this.activateRoute.snapshot.routeConfig.path === 'orderConfirmation') {
      this.returnSubject = this.fiatService.getpreviewMessage().subscribe((result) => {
        if (result) {
          this.order = true;
          this.orderData = result.orderData;
          if (this.orderData) {
            this.startPayment = result.URL;
            this.currencyRate = this.orderData.currencyRate;
            this.quantity = this.orderData.quantity;
            this.currentprice = this.orderData.currentprice;
            this.commission = this.orderData.fixedprice * 0.039;
          }
        }
      });
    }
  }


  verifyPayment(authority: any) {
    this.fiatService.verifyUserPayment(authority).subscribe((status) => {
      if (status) {
        if (status.data.Success === 0) {
          window.location.href = status.redirectPage;
        }
      }
    });
  }


  payNow() {
    window.location.href = this.startPayment;
  }

  ngOnDestroy() {
    this.returnSubject.unsubscribe();
  }

}
