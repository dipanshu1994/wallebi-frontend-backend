import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { MatTableDataSource, PageEvent, MatSlideToggle, MatSnackBar } from '@angular/material';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-manage-crypto',
  templateUrl: './manage-crypto.component.html',
  styleUrls: ['./manage-crypto.component.css']
})
export class ManageCryptoComponent implements OnInit {


  displayedColumns: string[] = [
    'title', 'type', 'symbol', 'fee', 'exchangeFee', 'tradeFee', 'createdAt', 'status', 'tradestatus', 'buy&sell'];

  dataSource = new MatTableDataSource();


  pageIndex = 0;
  pageLimit = [5, 10, 15];


  limitCurrency = 10;

  totalCurrencyLength = 0;

  search = undefined;

  serverURL: string;

  constructor(
    private userService: UserService,
    private snack: MatSnackBar
  ) {
    this.serverURL = environment.currencyImage;
  }

  ngOnInit() {
    this.getAllCurrencies();
  }


  // fetchg currency
  getAllCurrencies() {
    this.userService.fetchAllCurrencies(this.pageIndex, this.limitCurrency, this.search).subscribe((currency) => {
      if (currency) {
        this.dataSource.data = currency.currency;
        this.totalCurrencyLength = currency.count;
      }
    });
  }


  // searching in currecy
  searchCurrencies(value: any) {
    this.search = value;
    this.getAllCurrencies();
  }

  // chnage limit and previous next button in currency
  changeCurrencyChoise(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitCurrency = event.pageSize;
    this.getAllCurrencies();
  }

  // chnage currency status active to inactive
  changeCurrencyStatus(event: MatSlideToggle, id: any) {
    const changeStatus = {
      status: '',
      _id: id
    };
    if (event.checked) {
      changeStatus.status = 'Active';
    } else {
      changeStatus.status = 'Inactive';
    }
    this.userService.changeStausOfCurrency(changeStatus.status, changeStatus._id).subscribe((status) => {
      if (status.success === true) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      } else if (status.success === false) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }


  // chnage currency trade status active to inactive
  changeCurrencyTradeStatus(event: MatSlideToggle, id: any) {
    const changeStatus = {
      tradeStatus: event.checked,
      _id: id
    };
    if (event.checked) {
      changeStatus.tradeStatus = true;
    } else {
      changeStatus.tradeStatus = false;
    }
    this.userService.changeTradeStatus(changeStatus.tradeStatus, changeStatus._id).subscribe((status) => {
      if (status.success === true) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      } else if (status.success === false) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }


  // change currency buy sell status active to inactive
  changeCurrencyBuySell(event: MatSlideToggle, id: any) {
    const changeStatus = {
      buySellStatus: event.checked,
      _id: id
    };
    if (event.checked) {
      changeStatus.buySellStatus = true;
    } else {
      changeStatus.buySellStatus = false;
    }
    this.userService.changeCurrencyBuySellStatus(changeStatus.buySellStatus, changeStatus._id).subscribe((status) => {
      if (status.success === true) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      } else if (status.success === false) {
        this.snack.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }


  editFee(fee: any) {
    console.log(fee);
  }

}
