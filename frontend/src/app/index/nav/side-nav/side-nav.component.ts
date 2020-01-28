import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RegisterComponent } from '../../register/register.component';
import { LoginComponent } from '../../login/login.component';
import { MatDialogRef, MatDialog } from '@angular/material';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {

  loginDialogRef: MatDialogRef<LoginComponent>;
  registerDialogRef: MatDialogRef<RegisterComponent>;
  @Output() sidenavClose = new EventEmitter();

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  }
  openLoginDialog() {
    this.loginDialogRef = this.dialog.open(LoginComponent, {
      width: '400px',
      height: '400px',
    });
    this.sidenavClose.emit();

  }

  openRegisterDialog() {
    this.registerDialogRef = this.dialog.open(RegisterComponent, {
      width: '400px'
    });
    this.sidenavClose.emit();

  }

}
