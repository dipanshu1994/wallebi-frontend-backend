import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

import { UsersService } from '../../services/users.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {


  constructor(
    private userService: UsersService,
    private snack: MatSnackBar,
    private router: Router,
    private translate: TranslateService
    ) {
      translate.setDefaultLang('en');
    }

  // forgot password form
  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  ngOnInit() {
  }

  // convenience getter for easy access to form fields
  get controls() { return this.forgotPasswordForm.controls; }


  // send forgot password email
  sendForgotEmail() {
    this.userService.forgotPassword(this.forgotPasswordForm.value).subscribe((data: any) => {
      if (data.success === false) {
        this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
      if (data.success === true) {
        this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.router.navigate(['']);
      }
      if (data[0]) {
        this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  redirectLogin() {
    this.router.navigate(['']);
  }
}
