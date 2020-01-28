import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {

  qrCode = false;
  proof = false;
  address = '';
  balance = 0;
  logo: any;
  imageProof = '';
  rejectedReason = false;
  rejectFront = false;
  rejectBack = false;
  rejectSelfe = false;
  rejectAddress = false;
  transaction = false;
  tnxStatus: any;
  amount: any;
  receiverAddress: any;
  senderAddress: any;
  tnxFee: any;
  tnxType: any;
  txId: any;
  currencyType: any;
  serverURL: any;
  preventCustomer = false;
  rejectBank = false;
  userId: any;


  documnetRejectionForm = new FormGroup({
    userId: new FormControl('', [Validators.required]),
    rejectionResosn: new FormControl('', [Validators.required]),
    rejectedDocument: new FormControl('', Validators.required)
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private qrDailogRef: MatDialogRef<DialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private route: Router
  ) {
    this.serverURL = environment.currencyImage;
    if (data) {
      this.qrCode = data.qrCode;
      this.proof = data.proof;
      this.rejectedReason = data.reason;
      this.transaction = data.transaction;
      if (this.rejectedReason) {
        this.rejectFront = data.records.rejectFrontProof;
        this.rejectBack = data.records.rejectBackProof;
        this.rejectSelfe = data.records.rejectSelfie;
        this.rejectAddress = data.records.rejectAddress;
        this.preventCustomer = data.records.preventCustomer;
        this.rejectBank = data.records.rejectBank;
      }
      if (this.qrCode) {
        this.address = data.walletDetails.address;
        this.balance = data.walletDetails.balance;
        this.logo = data.walletDetails.logo;
      }
      if (this.proof) {
        this.imageProof = data.imageProof;
      }
      if (this.rejectedReason) {
        this.documnetRejectionForm.patchValue({ userId: data.records.id });
        this.documnetRejectionForm.patchValue({ rejectedDocument: data.records.type });
        if (this.preventCustomer) {
          this.documnetRejectionForm.patchValue({userId: data.records.userId});
          this.documnetRejectionForm.removeControl('rejectedDocument');
          this.documnetRejectionForm.addControl('typeOfUser', new FormControl(data.records.typeOfUser, [Validators.required]));
        }
        if (this.rejectBank) {
          this.userId = data.records.userId;
          this.documnetRejectionForm.removeControl('rejectedDocument');
          this.documnetRejectionForm.removeControl('userId');
          this.documnetRejectionForm.addControl('_id', new FormControl(data.records._id, [Validators.required]));
          this.documnetRejectionForm.addControl('status', new FormControl(data.records.status, [Validators.required]));
        }
      }
      if (this.transaction) {
        this.tnxStatus = data.details.TrnxStatus;
        this.amount = data.details.amount;
        this.receiverAddress = data.details.receiverAddress;
        this.senderAddress = data.details.senderAddress;
        this.tnxFee = data.details.trnxFee;
        this.tnxType = data.details.trnxType;
        this.txId = data.details.txId;
        this.currencyType = data.details.currencyType;
      }
    }
  }

  ngOnInit() {
    // console.log(this.documnetRejectionForm.value);
  }



  // convenience getter for easy access to form fields
  get controls() { return this.documnetRejectionForm.controls; }



  SubmitReason() {
    if (this.documnetRejectionForm.invalid) {
      return false;
    } else {
      if (this.rejectFront) {
        this.userService.rejectCustomerFrontSide(this.documnetRejectionForm.value).subscribe((rejectFront) => {
          if (rejectFront) {
            if (rejectFront.success === true) {
              this.closeDilaog();
              this.snackBar.open(rejectFront.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
              this.route.navigate(['view-customers']);
            } else {
              this.snackBar.open(rejectFront.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
            }
          }
        }, error => {
          this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        });
      } else if (this.rejectBack) {
        this.userService.rejectCustomerBackSide(this.documnetRejectionForm.value).subscribe((rejectBack) => {
          if (rejectBack) {
            if (rejectBack.success === true) {
              this.closeDilaog();
              this.snackBar.open(rejectBack.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
              this.route.navigate(['view-customers']);
            } else {
              this.snackBar.open(rejectBack.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
            }
          }
        }, error => {
          this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        });
      } else if (this.rejectSelfe) {
        this.userService.rejectCustomerSelfie(this.documnetRejectionForm.value).subscribe((rejectSelfie) => {
          if (rejectSelfie) {
            if (rejectSelfie.success === true) {
              this.closeDilaog();
              this.snackBar.open(rejectSelfie.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
              this.route.navigate(['view-customers']);
            } else {
              this.snackBar.open(rejectSelfie.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
            }
          }
        }, error => {
          this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        });
      } else if (this.rejectAddress) {
        this.userService.rejectAddressProof(this.documnetRejectionForm.value).subscribe((reject) => {
          if (reject) {
            if (reject.success === true) {
              this.closeDilaog();
              this.snackBar.open(reject.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
              this.route.navigate(['view-customers']);
            } else {
              this.snackBar.open(reject.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
            }
          }
        }, error => {
          this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        });
      } else if (this.preventCustomer) {
        this.userService.disableCustomer(this.documnetRejectionForm.value).subscribe((prevent) => {
          if (prevent) {
            this.snackBar.open(prevent.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
            this.closeDilaog();
          }
        });
      } else if (this.rejectBank) {
        this.userService.changeBankAccountStatus(this.userId, this.documnetRejectionForm.value).subscribe((status) => {
          if (status.success === true) {
            this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
            this.closeDilaog();
          } else {
            this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          }
        });
      }
    }
  }

  closeDilaog() {
    this.qrDailogRef.close();
  }

}
