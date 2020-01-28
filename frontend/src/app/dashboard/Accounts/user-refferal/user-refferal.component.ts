import { Component, OnInit, ViewChild } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar, MatPaginator, MatTableDataSource, MatSort, MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material';
import { OTPComponent } from 'src/app/otp/otp.component';
import { ReferralSystem } from '../../../_interface/referralUser.interface.';
import { TranslateService } from '@ngx-translate/core';



@Component({
  selector: 'app-user-refferal',
  templateUrl: './user-refferal.component.html',
  styleUrls: ['./user-refferal.component.css']
})

export class UserRefferalComponent implements OnInit {


  displayedColumns: string[] = ['date', 'firstname', 'email', 'status', 'approval'];
  dataSource = new MatTableDataSource<ReferralSystem>();
  referral: string;
  fieldState = true;
  referalURL: any;
  referralDailogRef: MatDialogRef<OTPComponent>;
  dialogConfig = new MatDialogConfig();
  referralUser: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private userService: UsersService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile) {
        this.referral = profile.user.referralCode;
        this.referalURL = `http://www.wallebi.com/signup/${this.referral}`;
      }
    }, error => {
      this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });

    this.getReferral();
    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getReferral() {
    this.userService.registerWithReferral().subscribe((user) => {
      if (user) {
        this.dataSource.data = user; // on data receive populate dataSource.data array
        this.referralUser = user;
      }
    }, error => {
      this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  copyReferral(userReferral) {
    userReferral.select();
    document.execCommand('copy');
    userReferral.setSelectionRange(0, 0);
    this.snack.open('Referral URL copied', 'X', { duration: 3000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
  }


  shareReferral(value: string) {
    this.referralDailogRef = this.dialog.open(OTPComponent, {
      width: '400px',
      height: '400px',
      disableClose: false,
      data: this.dialogConfig.data = {
        shareReferral: true,
        referralURL: value
      }
    });
  }
}
