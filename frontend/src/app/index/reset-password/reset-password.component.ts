import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  iPassword: string = null;
  hide = true;

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private userService: UsersService,
    private snack: MatSnackBar
  ) { }

  // reset password form
  resetPasswordForm = new FormGroup({
    password: new FormControl('', [Validators.required,
    Validators.pattern('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$')]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  ngOnInit() {
  }

  // convenience getter for easy access to form fields
  get controls() { return this.resetPasswordForm.controls; }


  // store password for confirm password
  StorePassword(event: any): void {
    this.iPassword = event.target.value !== '' ? event.target.value : null;
  }


  // setting custom error for confirm password
  GetInvalidMessage(event: any): void {
    if (event.target.validity.patternMismatch && event.target.id === 'inputConfirmaPassword') {
      event.target.setCustomValidity('Passwords do not match');
    }
  }



  // update user password
  updatePassword() {
    const token = this.activeRoute.snapshot.queryParams.token;
    const value = {
      password: this.resetPasswordForm.controls.password.value,
      tokens: token
    };
    this.userService.resetPassword(value).subscribe((data: any) => {
      if (data.success === false) {
        this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
      if (data[0]) {
        this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
      if (data.success === true) {
        this.router.navigate(['/login']);
        this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
    });
  }
}
