import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { MatTableDataSource, PageEvent, MatSlideToggle, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-providers-pair-fee',
  templateUrl: './providers-pair-fee.component.html',
  styleUrls: ['./providers-pair-fee.component.css']
})
export class ProvidersPairFeeComponent implements OnInit {

  pageIndex = 0;
  pageLimit = [5, 10, 15];
  dataSource = new MatTableDataSource();
  displayedColumns: string[] =
    ['pairName', 'adminBuyFee', 'adminSellFee', 'b2bxBuyFee', 'b2bxSellFee', 'exmoBuyFee', 'exmoSellFee', 'createdAt', 'action'];

  limitPair = 50;

  totalPairLength = 0;

  search = undefined;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snack: MatSnackBar
  ) { }

  ngOnInit() {
    this.getProviderPairFee();
  }

  getProviderPairFee() {
    this.adminService.getAllProviderFee(this.pageIndex, this.limitPair, this.search).subscribe((pair) => {
      if (pair) {
        this.dataSource = pair.pair;
        this.totalPairLength = pair.count;
      }
    });
  }



  // searching in currecy
  searchPair(value: any) {
    this.search = value;
    this.getProviderPairFee();
  }


  // chnage limit and previous next button in currency
  changePair(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitPair = event.pageSize;
    this.getProviderPairFee();
  }


  redirectAfterConfirmation(id: any) {
    this.router.navigate(['/editPairDetails', id]);
  }


  changePairStatus(event: MatSlideToggle, ids: any) {
    // tslint:disable-next-line:prefer-const
    let updateObj = {
      id: ids,
      status: true
    };
    if (event.checked === true) {
      updateObj.status = event.checked;
    } else if (event.checked === false) {
      updateObj.status = event.checked;
    }
    this.adminService.updateProvidePairStatus(updateObj.id, updateObj.status).subscribe((status) => {
      if (status.success === true) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (status.success === false) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }

}
