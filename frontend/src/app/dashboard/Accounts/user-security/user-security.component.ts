import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar, MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material';
import { UserSecurityService } from 'src/app/services/user-security.service';
import { ApiService } from 'src/app/services/api.service';
import { OTPComponent } from '../../../otp/otp.component';
import { UserKycVerificationService } from 'src/app/services/user-kyc-verification.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-security',
  templateUrl: './user-security.component.html',
  styleUrls: ['./user-security.component.css']
})
export class UserSecurityComponent implements OnInit {

  hide = true;
  iPassword: any;
  isAuthy: boolean;
  isWithdrawAuthy: boolean;
  isPasswordAuthy: boolean;
  isTradeAuthy: boolean;
  isAuthyPassword: boolean;

  user: any;
  userMobile: any;
  otpDailogRef: MatDialogRef<OTPComponent>;
  dialogConfig = new MatDialogConfig();

  constructor(
    private userSecurity: UserSecurityService,
    private snackBar: MatSnackBar,
    private apiSerice: ApiService,
    private dialog: MatDialog,
    private userKYCService: UserKycVerificationService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
  }

  // chnage password form
  changePasswordForm = new FormGroup({
    oldPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required,
    Validators.pattern('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$')]),
    confirmPassword: new FormControl('', [Validators.required])
  });


  ngOnInit() {
    this.userSecurity.getGoogleQRCode().subscribe((googleResult) => {
      console.log(googleResult);
    });
  }


  checkTwoFactorStatus() {
    this.userKYCService.getKycStatus().subscribe((result) => {
      if (result) {
        this.userMobile = result.mobile;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });

    this.userSecurity.twoFAStausofLogin().subscribe((result) => {
      if (result) {
        this.isAuthy = result.isAuthy;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });

    this.userSecurity.twoFAStausofWithdraw().subscribe((result) => {
      if (result) {
        this.isWithdrawAuthy = result.isWithdrawAuthy;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });

    this.userSecurity.twoFAStausofTrade().subscribe((result) => {
      if (result) {
        this.isTradeAuthy = result.isTradeAuthy;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });

    this.userSecurity.twoFAStausofPasswordChange().subscribe((result) => {
      if (result) {
        this.isPasswordAuthy = result.isPasswordAuthy;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // geting form controls for validation
  get controls() { return this.changePasswordForm.controls; }

  // storing password for confirm password match
  StorePassword(event: any): void {
    this.iPassword = event.target.value !== '' ? event.target.value : null;
  }

  // setting custom message for confirm password
  GetInvalidMessage(event: any): void {
    if (event.target.validity.patternMismatch && event.target.id === 'inputConfirmaPassword') {
      event.target.setCustomValidity('Passwords does not match');
    }
  }


  // open dialog box for 2FA password change
  openOTPDialog() {
    this.otpDailogRef = this.dialog.open(OTPComponent, {
      width: '400px',
      height: '400px',
      data: this.dialogConfig.data = {
        changePassword: true,
        oldPassword: this.changePasswordForm.controls.oldPassword.value,
        newPassword: this.changePasswordForm.controls.newPassword.value
      }
    });
  }

  // update password method
  updatePassword() {
    this.userSecurity.updateUserPassword(this.changePasswordForm.value).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
      if (result.success === true && result.isAuthyPassword === true) {
        this.isAuthyPassword = true;
        this.openOTPDialog();
        this.changePasswordForm.reset();
      } else if (result.success === true) {
        this.changePasswordForm.reset();
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.apiSerice.logout();
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }



  // enable 2FA for login
  enable2FALogin(event: any) {
    const state = {
      isAuthy: this.isAuthy
    };
    this.userSecurity.twoFALogin(state).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['warning-snackbar'], horizontalPosition: 'end' });
        this.isAuthy = false;
      }
      if (result.success === true) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // enable 2FA fro withdraw
  enable2FAWithdraw(event: any) {
    const state = {
      isWithdrawAuthy: this.isWithdrawAuthy
    };
    this.userSecurity.twoFAForWithdraw(state).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['warning-snackbar'], horizontalPosition: 'end' });
        this.isWithdrawAuthy = false;
      }
      if (result.success === true) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // enable 2FA fro change password
  enable2FAPasswordChange(event: any) {
    const state = {
      isPasswordAuthy: this.isPasswordAuthy
    };
    this.userSecurity.twoFAForPasswordChange(state).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['warning-snackbar'], horizontalPosition: 'end' });
        this.isPasswordAuthy = false;
      }
      if (result.success === true) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // enable 2FA for trade
  enable2FATrade(event: any) {
    const state = {
      isTradeAuthy: this.isTradeAuthy
    };
    this.userSecurity.twoFAforTrade(state).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['warning-snackbar'], horizontalPosition: 'end' });
        this.isTradeAuthy = false;
      }
      if (result.success === true) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

}

