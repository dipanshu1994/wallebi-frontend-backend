import { Component, OnInit, Output, EventEmitter, NgZone } from '@angular/core';
import { LoginComponent } from '../../login/login.component';
import { RegisterComponent } from '../../register/register.component';
import { MatDialogRef, MatDialog, MatMenu } from '@angular/material';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/overlay';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnInit {

  loginDialogRef: MatDialogRef<LoginComponent>;
  registerDialogRef: MatDialogRef<RegisterComponent>;
  @Output() public sidenavToggle = new EventEmitter();

  private readonly SHRINK_TOP_SCROLL_POSITION = 1;
  shrinkToolbar = false;

  constructor(
    private dialog: MatDialog,
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone,
    private translate: TranslateService) {
      this.translate.use(localStorage.getItem('lang'));
  }

  ngOnInit() {
    this.scrollDispatcher.scrolled()
      .pipe(map((event: CdkScrollable) => this.getScrollPosition(event)))
      .subscribe(scrollTop => this.ngZone.run(() => this.shrinkToolbar = scrollTop > this.SHRINK_TOP_SCROLL_POSITION ? true : false));
  }

  public onToggleSidenav = () => {
    this.sidenavToggle.emit();
  }

  openLoginDialog() {
    this.loginDialogRef = this.dialog.open(LoginComponent, {
      width: '400px',
      height: 'auto',
    });
  }

  openRegisterDialog() {
    this.registerDialogRef = this.dialog.open(RegisterComponent, {
      height: 'auto',
      width: '400px'
    });
  }

  getScrollPosition(event) {
    if (event) {
      return event.getElementRef().nativeElement.scrollTop;
    } else {
      return window.scrollY;
    }
  }


  changeLanguage(value: any) {
    localStorage.setItem('lang', value);
    // location.reload();
    this.translate.use(value);
  }
}
