import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { MatTableDataSource, MatCheckbox, MatSnackBar, PageEvent } from '@angular/material';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liquidity-provider',
  templateUrl: './liquidity-provider.component.html',
  styleUrls: ['./liquidity-provider.component.css']
})
export class LiquidityProviderComponent implements OnInit {


  serverUrl: any;
  displayedColumns: string[] = ['no.', 'pairName', 'type', 'date', 'action'];
  dataSource = new MatTableDataSource();


  totalLengthPair = 0;
  limitPair = 10;
  pageIndex = 0;
  pageLimit = [5, 10, 15, 25, 50];
  search = undefined;

  constructor(
    private adminService: AdminService,
    private snack: MatSnackBar
  ) {
    this.serverUrl = environment.currencyImage;
  }

  ngOnInit() {
    this.activatedProvider();
  }



  activatedProvider() {
    this.adminService.activatedLiquidityProviders(this.pageIndex, this.limitPair, this.search).subscribe((providers) => {
      if (providers) {
        this.dataSource = providers.pair;
        this.totalLengthPair = providers.count;
      }
    });
  }


  getPairProviders(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitPair = event.pageSize;
    this.activatedProvider();
  }




  searchPairs(value: any) {
    this.search = value;
    this.activatedProvider();
  }


  changeProvider(event: MatCheckbox, type: any, id: any) {
    const changeProvider = {
      _id: id,
      provider: type,
      status: false
    };
    if (event.checked === true) {
      changeProvider.status = true;
    } else if (event.checked === false) {
      changeProvider.status = false;
    }
    this.adminService.changeProviderStatus(changeProvider).subscribe((result) => {
      if (result) {
        if (result.success === true) {
          this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
        if (result.success === false) {
          this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
      }
    });
  }
}
