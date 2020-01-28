import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatSnackBar, MatDialogRef } from '@angular/material';
import { UsersService } from 'src/app/services/users.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserSecurityService } from '../services/user-security.service';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ApiService } from '../services/api.service';


@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css'],
})
export class OTPComponent implements OnInit {

  email: any;
  hidden = false;
  verifyLogin: boolean;
  changePassword: boolean;
  updateProfile: boolean;
  oldPassword: any;
  newPassword: any;
  file: File;
  imagePreview: any;
  imageChangedEvent: any = '';
  croppedImage: any = '';
  shareReferral: any;
  referralURL: any;
  resendEmail = false;
  logout = false;
  logoutInactivity = false;



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UsersService,
    private snack: MatSnackBar,
    private router: Router,
    public otpDailogRef: MatDialogRef<OTPComponent>,
    public userSecurity: UserSecurityService,
    private snackBar: MatSnackBar,
    private apiService: ApiService
  ) {
    if (data) {
      this.verifyLogin = data.verify2FA;
      this.changePassword = data.changePassword;
      this.updateProfile = data.updateProfile;
      this.shareReferral = data.shareReferral;
      this.resendEmail = data.resendEmail;
      this.logout = data.logout;
      this.logoutInactivity = data.logoutInactivity;
    }
    if (this.verifyLogin) {
      this.email = data.email;
    }
    if (this.changePassword) {
      this.oldPassword = data.oldPassword;
      this.newPassword = data.newPassword;
    }
    if (this.updateProfile) {
      this.file = data.image;
    }
    if (data) {
      this.referralURL = data.referralURL;
    }
  }

  verifyLoginOTPForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    smsCode: new FormControl('', [Validators.required, Validators.pattern('^\\d+$')])
  });

  verifyChangePasswordForm = new FormGroup({
    oldPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', Validators.required),
    smsCode: new FormControl('', [Validators.required, Validators.pattern('^\\d+$')])
  });

  profileForm = new FormGroup({
    profilePicture: new FormControl('', Validators.required)
  });

  resendEmailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  ngOnInit() {
    if (this.verifyLogin) {
      this.verifyLoginOTPForm.patchValue({ email: this.email });
    }
    if (this.changePassword) {
      this.verifyChangePasswordForm.patchValue({ oldPassword: this.oldPassword });
      this.verifyChangePasswordForm.patchValue({ newPassword: this.newPassword });
    }
    if (this.file) {
      this.imageChangedEvent = this.file;
    }
    if (this.resendEmail) {
      this.resendEmailForm.patchValue({email: this.data.email });
    }
  }

  // convenience getter for easy access to form fields
  get controls() { return this.verifyLoginOTPForm.controls; }

  // convenience getter for easy access to form controls
  get Changecontrols() { return this.verifyChangePasswordForm.controls; }


  // verifying login otp when 2FA is enable
  VerifyLoginOTP() {
    if (this.verifyLoginOTPForm.invalid) {
      return false;
    } else {
      this.userService.VerifyLoginOTP(this.verifyLoginOTPForm.value).subscribe((data: any) => {
        if (data.success === false) {
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data[0]) {
          this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data.success === true) {
          this.otpDailogRef.close();
          this.router.navigate(['/dashboard']);
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      });
    }
  }

  // verifying OTP for password change
  VerifyChnagePasswordOTP() {
    if (this.verifyChangePasswordForm.invalid) {
      return false;
    } else {
      this.userSecurity.verifyChnagePasswordOTP(this.verifyChangePasswordForm.value).subscribe((data: any) => {
        if (data.success === false) {
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data[0]) {
          this.snack.open(data[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (data.success === true) {
          this.otpDailogRef.close();
          this.router.navigate(['/user-security']);
          this.snack.open(data.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      });
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }


  imageLoaded() {
    // show cropper
  }
  loadImageFailed() {
    // show message
  }

  updateProfilePicture() {
    const image = {
      base64: this.croppedImage
    };
    this.userService.updateProfilePicture(image).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
      if (result.success === true) {
        this.otpDailogRef.close();
        this.router.navigate(['profile']);
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      }
      if (result[0]) {
        this.snackBar.open(result[0], 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }

  closeUpdateProfile() {
    this.otpDailogRef.close();
  }

  shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareTwitter() {
    const url = `https://twitter.com/intent/tweet?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }
  shareLinkedIN() {
    const url = `https://www.linkedin.com/shareArticle?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareTelegram() {
    const url = `https://telegram.me/share/?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareWhatsApp() {
    const url = `https://api.whatsapp.com/send?text=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareGooglePlus() {
    const url = `https://plus.google.com/up/?continue=https://plus.google.com/share?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareVK() {
    const url = `https://oauth.vk.com/authorize?client_id=-1&redirect_uri=https://vk.com/share.php?url=${this.referralURL}&display=widget`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareOk() {
    const url =
    `https://connect.ok.ru/dk?st.cmd=OAuth2Login&st.layout=w&st.redirect=%252Fdk%253Fcmd%253DWidgetSharePreview%2526amp%253Bst.
    cmd%253DWidgetSharePreview%2526amp%253Bst.shareUrl%253D${this.referralURL}&st._wt=1&st.client_id=-1`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareReddit() {
    const url = `https://www.reddit.com/submit?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareTumbller() {
    const url = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${this.referralURL}&posttype=link`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareLiveJournal() {
    const url = `https://www.livejournal.com/update.bml`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareMailRu() {
    const url = ``;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareViber() {
    const url = `viber://forward?text=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareFacebookWork() {
    const url = `https://my.workplace.com/sharer.php?u=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareLine() {
    const url = `https://social-plugins.line.me/lineit/share?url=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  shareMail() {
    const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&source=mailto&body=${this.referralURL}`;
    window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }


  resendEmailToUser() {
    if (this.resendEmailForm.invalid) {
      return false;
    } else {
      this.userService.resendEmail(this.resendEmailForm.value).subscribe((mailStatus) => {
        if (mailStatus.success === false) {
          this.snackBar.open(mailStatus.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        } else {
          this.snackBar.open(mailStatus.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.closeUpdateProfile();
        }
      });
    }
  }

  onLogout() {
    this.closeUpdateProfile();
    this.apiService.logout();
    this.snackBar.open(
      'You are logged out successfully!', 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
    this.router.navigate(['']);
  }


  openLoginDialog() {
    this.otpDailogRef.close();
    this.router.navigate(['/index']);
    // alert('Working');
  }
}
