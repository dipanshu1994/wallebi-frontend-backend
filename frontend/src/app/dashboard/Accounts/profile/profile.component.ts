import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar, MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material';
import { UserKycVerificationService } from 'src/app/services/user-kyc-verification.service';
import { BankAccountService } from 'src/app/services/bank-account.service';
import { OTPComponent } from 'src/app/otp/otp.component';
import { environment } from '../../../../environments/environment';
import { flashAnimate } from 'src/app/app.animation';
import { TranslateService } from '@ngx-translate/core';
import { SocketService } from 'src/app/services/socket.service';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  animations: [
    flashAnimate
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {

  profileStatus: any;
  language: any;
  currency: any;
  kycStatus: any;
  documentNumber: any;
  issuerCountry: any;
  firstName: any;
  lastName: any;
  email: any;
  phone: any;
  houseNo: any;
  street: any;
  city: any;
  district: any;
  zipCode: any;
  country: any;
  countryList: any;
  profileImage: any;
  defaultState = true;
  registerAddressState = true;
  addressPreview: any;
  user: any;


  profileDialog: MatDialogRef<OTPComponent>;
  dialogConfig = new MatDialogConfig();

  constructor(
    private userService: UsersService,
    private snackBar: MatSnackBar,
    private kycService: UserKycVerificationService,
    private bankAccountService: BankAccountService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private socketSerive: SocketService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.profileSocket();
    this.translate.setDefaultLang('en');
  }

  // update profile picture form
  profileForm = new FormGroup({
    profilePicture: new FormControl('', [Validators.required])
  });


  // update your registered address
  registerAddressForm = new FormGroup({
    houseNo: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('^[ A-Za-z0-9_-]*$')]),
    street: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('^[ A-Za-z0-9_-]*$')]),
    city: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('[a-zA-Z][a-zA-Z ]+[a-zA-Z]$')]),
    district: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('[a-zA-Z][a-zA-Z ]+[a-zA-Z]$')]),
    zipCode: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]),
    country: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
    useraddressimage: new FormControl({ value: '', disabled: true }, [Validators.required])
  });



  ngOnInit() {
    this.kycService.getCountryList().subscribe((result) => {
      if (result) {
        this.countryList = result;
      }
    });

    this.displayUserPhoto();


    this.userKYCDetails();

  }



  profileSocket() {
    this.user = this.apiService.getUserDetails();
    this.socketSerive.onUpdateProfile(this.user.id).subscribe((profile) => {
      this.displayUserPhoto();
    });
  }


  displayUserPhoto() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile) {
        if (profile.user.profileImage) {
          this.profileImage = `${environment.profileImage}${profile.user.profileImage}`;
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }



  userKYCDetails() {
    this.kycService.getKycStatus().subscribe((status) => {
      if (status) {
        this.kycStatus = status.doc_verification;
        this.houseNo = status.housename;
        this.city = status.city;
        this.district = status.district;
        this.zipCode = status.pincode;
        this.country = status.country;
        this.street = status.address;
        if (status.id_data) {
          this.documentNumber = status.id_data.idnumber;
          this.issuerCountry = status.id_data.countryid;
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }





  // getting controls of personal details for form validation
  get personalControls() { return this.registerAddressForm.controls; }

  openProfile() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile) {
        this.profileStatus = profile.user.approval;
        this.language = profile.user.language;
        this.currency = profile.user.currency;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

  openIdentification() {
    this.userKYCDetails();
  }

  openPersonal() {
    this.userService.userProfile().subscribe((profile) => {
      if (profile) {
        this.firstName = profile.user.firstname;
        this.lastName = profile.user.lastname;
        this.email = profile.user.email;
        if (profile.user.userProfileId) {
          this.phone = profile.user.userProfileId.mobile;
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

  openRegister() {
    this.registerAddressState = true;
    this.registerAddressForm.disable();
    this.kycService.getKycStatus().subscribe((status) => {
      if (status) {
        this.houseNo = status.housename;
        this.city = status.city;
        this.district = status.district;
        this.zipCode = status.pincode;
        this.country = status.country;
        this.street = status.address;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }

  // updating user language
  onLanguageChange(event: any) {
    const language = {
      language: event
    };
    this.translate.use(event);
    localStorage.setItem('lang', event);
    this.userService.changeLanguage(language).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
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


  // updating user currency
  onCurrencyChange(event: any) {
    const currency = {
      currency: event
    };
    this.bankAccountService.changeCurrency(currency).subscribe((result) => {
      if (result.success === false) {
        this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
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

  // picking new profile and open dialog box for cropping image
  onPicProfile(event: any) {
    this.profileDialog = this.dialog.open(OTPComponent, {
      height: 'auto',
      width: '450px',
      disableClose: true,
      data: this.dialogConfig.data = {
        updateProfile: true,
        image: event
      }
    });
  }


  enableAddressForm() {
    this.registerAddressState = false;
    this.registerAddressForm.enable();
    this.addressPreview = '';
  }

  // picking user address proof and patching it to personal details form and showing preview
  onAddressPicked(event: any) {
    // tslint:disable-next-line: deprecation
    const file = (event.target as HTMLInputElement).files[0];
    this.registerAddressForm.patchValue({ useraddressimage: file });
    this.registerAddressForm.get('useraddressimage').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.addressPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  updateAddressrForm() {
    if (this.registerAddressForm.invalid) {
      return false;
    } else {
      this.kycService.updateAddressProof(this.registerAddressForm.value.houseNo,
        this.registerAddressForm.value.street,
        this.registerAddressForm.value.city,
        this.registerAddressForm.value.district,
        this.registerAddressForm.value.zipCode,
        this.registerAddressForm.value.country,
        this.registerAddressForm.value.useraddressimage
      ).subscribe((result) => {
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
        if (result.success === true) {
          this.registerAddressForm.disable();
          this.registerAddressState = true;
          this.addressPreview = '';
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

  disableAddressForm() {
    this.registerAddressState = true;
    this.registerAddressForm.disable();
    this.addressPreview = '';
  }


  ngOnDestroy() {
    this.socketSerive.onUpdateProfileUnSubscribe(this.user.id);
  }

}
