import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';

import { UsersService } from 'src/app/services/users.service';
import { PusherService } from 'src/app/services/pusher.service';
import { LoginComponent } from '../login/login.component';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  iPassword: string = null;
  hide = true;
  loginDialogRef: MatDialogRef<LoginComponent>;
  referralCode: any;


  constructor(
    private userService: UsersService,
    private snack: MatSnackBar,
    private router: Router,
    private pusher: PusherService,
    public registerDialog: MatDialogRef<RegisterComponent>,
    public loginDialog: MatDialogRef<LoginComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
      if (data) {
        this.referralCode = data.refer;
      }
    }

  newUserFrom = new FormGroup({
    firstname: new FormControl('', [Validators.required, Validators.pattern('([a-zA-Z]{3,30}\s*)+')]),
    lastname: new FormControl('', [Validators.required, Validators.pattern('([a-zA-Z]{3,30}\s*)+')]),
    email: new FormControl('', [Validators.required, Validators.email]),
    userLanguage: new FormControl('', [Validators.required]),
    referralCode: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.maxLength(20),
    Validators.pattern('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$')]),
    confirmPassword: new FormControl('', [Validators.required]),
    recaptcha: new FormControl('', [Validators.required])
  });

  ngOnInit() {
    if (this.referralCode) {
      this.newUserFrom.patchValue({ referralCode: this.referralCode });
    }
  }

  resolved(event: RecaptchaModule) {
    this.newUserFrom.patchValue({recaptcha: event});
  }

  // convenience getter for easy access to form fields
  get controls() { return this.newUserFrom.controls; }



  // storing password for confirm password
  StorePassword(event: any): void {
    this.iPassword = event.target.value !== '' ? event.target.value : null;
  }


  // setting custom message for confirm password
  GetInvalidMessage(event: any): void {
    if (event.target.validity.patternMismatch && event.target.id === 'inputConfirmaPassword') {
      event.target.setCustomValidity('Passwords does not match');
    }
  }


  // user registeration method
  register() {
    if (this.newUserFrom.invalid) {
      return false;
    } else {
      this.userService.registration(this.newUserFrom.value).subscribe(data => {
        if (data.success === false) {
          this.snack.open(data.msg, 'X', { duration: 4000 , panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data[0]) {
          this.snack.open(data[0], 'X', { duration: 4000 , panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data.success === true) {
          this.snack.open(data.msg, 'X', { duration: 4000 , panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          // this.pusher.channel.bind('user-registeration', (result) => {
          //   console.log('Pusher', result);
          // });
          this.registerDialog.close();
        }
      });
    }
  }

  navigateLogin() {
    this.registerDialog.close();
    this.loginDialogRef = this.dialog.open(LoginComponent, {
      height: 'auto',
      width: '400px'
    });
  }

}
