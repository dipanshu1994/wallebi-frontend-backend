import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { MatSnackBar  } from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})


export class LoginComponent implements OnInit {

  rememberEmail: any;
  rememberPassword: any;
  remember = false;
  errorMessage = '';
  hide = true;
  isAuthy = false;



  constructor(
    private adminServie: AdminService,
    private snack: MatSnackBar,
    private router: Router,
    private apiService: ApiService
  ) {
    }


  // login form
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  ngOnInit() {
    if (this.apiService.isLoggedIn) {
      this.router.navigate(['dashboard']);
    }
  }

  // convenience getter for easy access to form fields
  get controls() { return this.loginForm.controls; }

  // login user
  loginUser() {
    if (this.loginForm.invalid) {
      return false;
    } else {
      this.adminServie.login(this.loginForm.value).subscribe((data: any) => {
        if (data.success === false) {
          this.snack.open(data.msg, 'X',
          { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data[0]) {
          this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data.success === true) {
          this.router.navigate(['/dashboard']);
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      }, error => {
        this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      });
    }
  }


}
