import { Component, OnInit } from '@angular/core';
import { CurrencyService } from 'src/app/services/currency.service';
import { UsersService } from 'src/app/services/users.service';
import { TranslateService } from '@ngx-translate/core';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private currencyService: CurrencyService,
    private userServie: UsersService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit() {
    this.genratingUserWallet();
    this.activatingToken();
    this.genrateFiatWallet();
    this.gettingUserProfileDetails();
  }

  gettingUserProfileDetails() {
    this.userServie.userProfile().subscribe((user) => {
      localStorage.setItem('lang', user.user.language);
      this.translate.use(localStorage.getItem('lang'));
    });
  }

  activatingToken() {
    this.currencyService.updateEtherInToken().subscribe((result) => {
      if (result) {
      }
    });
  }


  genratingUserWallet() {
    this.currencyService.genratWallet().subscribe((result) => {
      // console.log(result);
    });
  }

  genrateFiatWallet() {
    this.currencyService.genrateFiatWalletForUser().subscribe((fait) => {
      if (fait) {
      }
    });
  }



}
