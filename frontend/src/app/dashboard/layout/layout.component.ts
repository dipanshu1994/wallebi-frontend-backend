import { Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/services/api.service';
import { MatSnackBar, MatBottomSheet, MatDialogRef, MatDialog } from '@angular/material';
import { UserIdleService } from 'angular-user-idle';
import { ConnectionService } from 'ng-connection-service';
import { OTPComponent } from 'src/app/otp/otp.component';
import { TranslateService } from '@ngx-translate/core';
import { SocketService } from 'src/app/services/socket.service';


@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {

  mode = 'side';
  opened = true;
  layoutGap = '64';
  fixedInViewport = true;
  firstName: any;
  lastName: any;
  profileImage: any;


  status = 'ONLINE';
  isConnected = true;

  user: any;
  otpDailogRef: MatDialogRef<OTPComponent>;


  public constructor(
    private breakPointObserve: BreakpointObserver,
    private userService: UsersService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private userIdle: UserIdleService,
    private connectionService: ConnectionService,
    private translate: TranslateService,
    private socketSerive: SocketService,
    private dialog: MatDialog
  ) {
    this.profileSocket();
    this.translate.use(localStorage.getItem('lang'));
    this.connectionService.monitor().subscribe((isConnected) => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = 'ONLINE';
        // this.bottomSheet.open(OTPComponent);
      } else {
        this.status = 'OFFLINE';
        // this.bottomSheet.open(OTPComponent);
      }
    });
  }

  ngOnInit() {
    const breakpoints = Object.keys(Breakpoints).map(key => Breakpoints[key]);
    this.breakPointObserve.observe(breakpoints)
      .pipe(map(bst => bst.matches))
      .subscribe(matched => {
        this.determineSidenavMode();
        this.determineLayoutGap();
      });

    this.userIdle.startWatching();

    this.userIdle.onTimerStart().subscribe(count => {
      const eventList = ['click', 'mouseover', 'keydown', 'DOMMouseScroll', 'mousewheel',
        'mousedown', 'touchstart', 'touchmove', 'scroll', 'keyup'];
      for (const event of eventList) {
        document.body.addEventListener(event, () => this.userIdle.resetTimer());
      }
    });


    this.userIdle.onTimeout().subscribe(() => {
      this.userIdle.stopWatching();
      window.localStorage.removeItem('sdasd923hd9dwe');
      this.logoutAfterInactivity();
    });

    this.userProfile();

  }



  logoutAfterInactivity() {
    this.otpDailogRef = this.dialog.open(OTPComponent, {
      width : '400px',
      height: 'auto',
      disableClose: true,
      data: {
        logoutInactivity: true
      }
    });
    this.otpDailogRef.afterClosed().subscribe(() => {
      // this.onlogout();
      this.apiService.logout();
    });
  }


  profileSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketSerive.onUpdateProfile(this.user.id).subscribe((profile) => {
      // console.log(profile);
      // this.socketSerive.onUpdateProfileUnSubscribe(this.user.id);
      this.profileImage = profile.base;
    });
  }


  userProfile() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile) {
        this.firstName = profile.user.firstname;
        this.lastName = profile.user.lastname;
        if (profile.user.profileImage) {
          this.profileImage = `${environment.profileImage}${profile.user.profileImage}`;
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

  private determineSidenavMode(): void {
    if (
      this.isExtraSmallDevice() ||
      this.isSmallDevice()
    ) {
      this.fixedInViewport = false;
      this.mode = 'over';
      this.opened = false;
      return;
    }
    this.fixedInViewport = true;
    this.mode = 'side';
  }

  private determineLayoutGap(): void {
    if (this.isExtraSmallDevice() || this.isSmallDevice()) {
      this.layoutGap = '0';
      return;
    }
    this.layoutGap = '64';
  }

  public isExtraSmallDevice(): boolean {
    return this.breakPointObserve.isMatched(Breakpoints.XSmall);
  }

  public isSmallDevice(): boolean {
    return this.breakPointObserve.isMatched(Breakpoints.Small);
  }

  onlogout() {
    this.apiService.logout();
    this.snackBar.open(
      'You are logged out successfully!', 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
    this.router.navigate(['']);
  }


  closeSideNav() {
    const breakpoints = Object.keys(Breakpoints).map(key => Breakpoints[key]);
    this.breakPointObserve.observe(breakpoints)
      .pipe(map(bst => bst.matches))
      .subscribe(matched => {
        this.determineSidenavMode();
        this.determineLayoutGap();
      });
  }



  logoutConfirmation() {
    this.otpDailogRef = this.dialog.open(OTPComponent, {
      width: 'auto',
      height: ' auto ',
      disableClose: true,
      data: {
        logout: true
      }
    });
  }


  ngOnDestroy() {
    this.socketSerive.onUpdateProfileUnSubscribe(this.user.id);
  }

}
