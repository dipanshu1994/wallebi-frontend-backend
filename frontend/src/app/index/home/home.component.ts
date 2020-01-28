import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatSnackBar, MatDialogConfig, MatDialog } from '@angular/material';

import { UsersService } from '../../services/users.service';
import { PusherService } from 'src/app/services/pusher.service';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  dialogConfig = new MatDialogConfig();
  referal: any;
  constructor(
    private activeRoute: ActivatedRoute,
    private userService: UsersService,
    private router: Router,
    private snack: MatSnackBar,
    private pusher: PusherService,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const token = this.activeRoute.snapshot.queryParams.token;
    const path = this.activeRoute.snapshot.routeConfig.path;

    // email verification for user reset password
    if (path === 'emailVerification') {
      this.userService.verifyEmail(token).subscribe((data: any) => {
        if (data.success === false) {
          this.router.navigate(['/login']);
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data[0]) {
          this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.router.navigate(['/login']);
        }
        if (data.success === true) {
          this.router.navigate(['']);
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      }, error => {
        this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      });
    }

    if (path === 'deviceVerification') {
      const deviceObject = {
        token: this.activeRoute.snapshot.queryParams.token,
        email: this.activeRoute.snapshot.queryParams.email
      };
      this.userService.verifyDevice(deviceObject).subscribe((result) => {
        if (result.success === false) {
          this.router.navigate(['/login']);
          this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (result[0]) {
          this.snack.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.router.navigate(['/login']);
        }
        if (result.success === true) {
          this.router.navigate(['']);
          this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      }, error => {
        this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      });

    }
    setTimeout(() => {
      this.cd.detach();
      if (path === 'signup/:referalCode') {
        this.referal = this.activeRoute.snapshot.paramMap.get('referalCode');
        if (this.referal) {
          this.router.navigate(['']);
          this.dialog.open(RegisterComponent, {
            width: '400px',
            data: this.dialogConfig.data = {
              refer: this.referal,
            }
          });
        }
      }
    }, 0);
  }
}
