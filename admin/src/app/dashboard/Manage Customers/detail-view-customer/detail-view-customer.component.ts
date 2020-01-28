import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import {
  MatTabChangeEvent,
  MatTableDataSource,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MatSnackBar,
  PageEvent,
  MatSlideToggle
} from '@angular/material';
import { DialogComponent } from '../../dialog/dialog.component';

@Component({
  selector: 'app-detail-view-customer',
  templateUrl: './detail-view-customer.component.html',
  styleUrls: ['./detail-view-customer.component.css']
})
export class DetailViewCustomerComponent implements OnInit {

  userId: string;
  profileStatus: string;
  firstName: string;
  lastName: string;
  middleName: string;
  mobile: string;
  email: string;
  gender: string;
  day: string;
  month: string;
  year: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  profilePicture: string;

  isemail: boolean;


  kycStatus: string;


  idProofFront: any;
  idProofBack: any;
  selfie: any;
  addressProof: any;


  idProofFrontStatus: any;
  idProofBackStatus: any;
  selfieStatus: any;
  addressProofStatus: any;

  loginLogs: any;

  preventFromLogin: boolean;


  displayedColumns: string[] = ['Browser Name', 'OS', 'Device Type', 'IP Address', 'Mac Address', 'Date'];

  displayWalletColumns: string[] = ['title', 'symbol', 'balance', 'qr'];
  displayTradeWalletColumns: string[] = ['title', 'symbol', 'balance', 'tradeStatus'];

  dataSource = new MatTableDataSource();
  tradeDataSource = new MatTableDataSource();
  transactionDataSource = new MatTableDataSource();
  tnxDisplayedColumns: string[] = ['crypto', 'address', 'amount', 'date', 'fee', 'tnxid', 'action'];
  transactionDataSourceTopup = new MatTableDataSource();
  tnxDisplayedColumnsTopup: string[] = ['type', 'status', 'date', 'tradeId', 'cryptoAmount', 'cryptoType', 'txType'];

  transactionDataSourceWithdraw = new MatTableDataSource();
  tnxDisplayedColumnsWithdraw: string[] = ['type', 'status', 'date', 'cryptoAmount', 'cryptoType', 'txType', 'action'];

  transactionDataSourceTopupreq = new MatTableDataSource();
  tnxDisplayedColumnsTopupreq: string[] = ['type', 'date', 'cryptoAmount', 'cryptoType', 'txType'];



  qrCodeDailogRef: MatDialogRef<DialogComponent>;
  dialogConfig = new MatDialogConfig();


  totalLengthTnx = 0;
  totalLengthTrnx = 0;
  totalLengthTrnxs = 0;
  limitTnx = 10;
  pageIndex = 0;
  pageLimit = [15, 25, 50];
  search = undefined;
  searchtrx = undefined;
  searchtrxs = undefined;
  searchtrxss = undefined;
  serverUrl = environment.bankProofImage;
  cryptoAmt: any;
  cryptoTyp: any;
  disableApprove = false;
  trnxId: any;
  bankAccount: any;


  serverURL: any;
  tradeWallet: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.serverURL = environment.currencyImage;
  }

  ngOnInit() {
    this.userId = this.activatedRoute.snapshot.params.id;

    if (this.userId) {
      this.getUserBasicInfo(this.userId);
      this.gettingUserWallets(this.userId);
    }
  }



  // getting user and user profile infor
  getUserBasicInfo(userId) {
    this.userService.getSingleUserInfo(userId).subscribe((userProfile) => {
      if (userProfile) {
        if (userProfile.user.approval === 'pending') {
          this.profileStatus = userProfile.user.approval;
        }
        if (userProfile.user.approval === 'active') {
          this.profileStatus = userProfile.user.approval;
        }
        if (userProfile.user.approval === 'frozen') {
          this.profileStatus = userProfile.user.approval;
        }
        this.firstName = userProfile.user.firstname;
        this.lastName = userProfile.user.lastname;
        this.email = userProfile.user.email;
        this.isemail = userProfile.user.isemail;
        this.preventFromLogin = userProfile.user.isPreventLogin;
        if (userProfile.user.userProfileId) {
          this.middleName = userProfile.user.userProfileId.middlename;
          this.mobile = userProfile.user.userProfileId.mobile;
          this.gender = userProfile.user.userProfileId.gender;
          this.day = userProfile.user.userProfileId.dob.date;
          this.month = userProfile.user.userProfileId.dob.month;
          this.year = userProfile.user.userProfileId.dob.year;
          this.address = userProfile.user.userProfileId.address;
          this.city = userProfile.user.userProfileId.city;
          this.country = userProfile.user.userProfileId.country;
          this.zipCode = userProfile.user.userProfileId.pincode;
          this.profilePicture = `${environment.profileImage}${userProfile.user.profileImage}`;
          if (
            userProfile.user.userProfileId.doc_verification === 'pending'
            &&
            userProfile.user.userProfileId.doc_verification_back === 'pending'
            &&
            userProfile.user.userProfileId.address_verification === 'pending'
            &&
            userProfile.user.userProfileId.selfie_verification === 'pending'
          ) {
            this.kycStatus = 'pending';
          }
          if (
            userProfile.user.userProfileId.doc_verification === 'verified'
            &&
            userProfile.user.userProfileId.doc_verification_back === 'verified'
            &&
            userProfile.user.userProfileId.address_verification === 'verified'
            &&
            userProfile.user.userProfileId.selfie_verification === 'verified'
          ) {
            this.kycStatus = 'verified';
          }
          if (
            userProfile.user.userProfileId.doc_verification === 'rejected'
            &&
            userProfile.user.userProfileId.doc_verification_back === 'rejected'
            &&
            userProfile.user.userProfileId.address_verification === 'rejected'
            &&
            userProfile.user.userProfileId.selfie_verification === 'rejected'
          ) {
            this.kycStatus = 'rejected';
          }
        }
      }
    });
  }



  // getting user wallets info
  gettingUserWallets(userId) {
    this.userService.getWalletsInfo(userId).subscribe((wallets) => {
      if (wallets) {
        this.dataSource = wallets;
      }
    });
  }

  // getting user trade wallet info
  gettingUserTradeWallet(userId) {
    this.userService.getTradeWalletsInfo(userId).subscribe((tradeWallet) => {
      if (tradeWallet) {
        // console.log(tradeWallet);
        this.tradeDataSource = tradeWallet;
      }
    });
  }



  // getting user profile/ KYC Details
  getCustomerKyc() {
    this.userService.getSingleUserInfo(this.userId).subscribe((profile) => {
      if (profile.user.userProfileId) {
        if (profile.user.userProfileId.id_proof_front) {
          this.idProofFront = `${environment.idProofImage}${profile.user.userProfileId.id_proof_front}`;
        }
        if (profile.user.userProfileId.id_proof_back) {
          this.idProofBack = `${environment.idProofImage}${profile.user.userProfileId.id_proof_back}`;
        }
        if (profile.user.userProfileId.selfie) {
          this.selfie = `${environment.selfieImage}${profile.user.userProfileId.selfie}`;
        }
        if (profile.user.userProfileId.documents) {
          this.addressProof = `${environment.addressProofImage}${profile.user.userProfileId.documents}`;
        }
        this.idProofFrontStatus = profile.user.userProfileId.doc_verification;
        this.idProofBackStatus = profile.user.userProfileId.doc_verification_back;
        this.selfieStatus = profile.user.userProfileId.selfie_verification;
        this.addressProofStatus = profile.user.userProfileId.address_verification;
      }
    });
  }


  // on tab chnage getting user kyc data
  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 2) {
      this.gettingUserWallets(this.userId);
    }
    if (event.index === 1) {
      this.gettingUserTradeWallet(this.userId);
    }
    if (event.index === 2) {
      this.getCustomerKyc();
    }
    if (event.index === 3) {
      this.userBankAccount();
    }
    if (event.index === 4) {
      this.userAllCryptoTransactions();
    }
    if (event.index === 5) {
      this.userAllTopupTransactions();
    }
    if (event.index === 6) {
      this.userAllWithdrawTransactions();
    }
    if (event.index === 7) {
      this.userAllTopupreqTransactions();
    }
    if (event.index === 8) {
      this.userLoginLogs();
    }
  }



  userBankAccount() {
    this.userService.customerBankAccount(this.userId).subscribe((bank) => {
      if (bank) {
        this.bankAccount = bank;
      }
    });
  }


  approveAccount($event: MatSlideToggle, item: string) {
    const approveStatus = {
      status: '',
      _id: item,
    };
    if ($event.checked) {
      approveStatus.status = 'verified';
      this.changeBankStatus(approveStatus);
    }
  }


  rejectCustomerBankAccount(item: string) {
    const approveStatus = {
      status: 'rejected',
      _id: item,
      rejectBank: true,
      userId: this.userId
    };
    this.rejectWithReason(approveStatus);
  }





  changeBankStatus(bankStatus) {
    this.userService.changeBankAccountStatus(this.userId, bankStatus).subscribe((status) => {
      if (status.success === true) {
        this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.userBankAccount();
      } else {
        this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    });
  }




  getTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitTnx = event.pageSize;
    this.userAllCryptoTransactions();
  }




  userAllCryptoTransactions() {
    this.userService.userAllTransaction(this.userId, this.pageIndex, this.limitTnx, this.search).subscribe((tnx) => {
      this.transactionDataSource = tnx.transactions;
      this.totalLengthTnx = tnx.count;
    });
  }




  searchAll(value: any) {
    this.search = value;
    this.userAllCryptoTransactions();
  }



  searchAllTrnx(value: any) {
    this.searchtrx = value;
    this.userAllTopupTransactions();
  }



  searchAllTrnxs(value: any) {
    this.searchtrxs = value;
    this.userAllWithdrawTransactions();
  }



  searchAllTrnxsTopup(value: any) {
    this.searchtrxss = value;
    this.userAllTopupreqTransactions();
  }




  viewTnxDetails(value: any) {
    this.qrCodeDailogRef = this.dialog.open(DialogComponent, {
      height: 'auto',
      width: '550px',
      disableClose: false,
      data: this.dialogConfig.data = {
        transaction: true,
        details: value,
      }
    });
  }



  userAllTopupTransactions() {
    this.userService.userAllTopupTransaction(this.userId, this.pageIndex, this.limitTnx, this.searchtrx).subscribe((trnx) => {
      this.transactionDataSourceTopup = trnx.transactions;
      this.totalLengthTrnx = trnx.count;
    });
  }


  getAllTradeTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitTnx = event.pageSize;
    this.userAllTopupTransactions();
  }




  userAllWithdrawTransactions() {
    this.userService.userAllWithdrawTransaction(this.userId, this.pageIndex, this.limitTnx, this.searchtrxs).subscribe((trnx) => {
      this.transactionDataSourceWithdraw = trnx.transactions;
      this.totalLengthTrnxs = trnx.count;
    });
  }




  getWithdrawTnx(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitTnx = event.pageSize;
    this.userAllWithdrawTransactions();
  }




  userAllTopupreqTransactions() {
    this.userService.userAllTopupreqTransaction(this.userId, this.pageIndex, this.limitTnx, this.searchtrxss).subscribe((trnx) => {
      this.transactionDataSourceTopupreq = trnx.transactions;
      this.totalLengthTrnxs = trnx.count;
    });
  }




  transferCryptoToUser(cryptotype: any, cryptoamount: any, recordid: any, userid: any) {
    this.disableApprove = true;
    const transferAmount = {
      cryptoType: cryptotype,
      cryptoAmount: cryptoamount,
      recordId: recordid,
      userId: userid
    };
    this.userService.transferCryptoToUsers(transferAmount).subscribe((trnx) => {
      if (trnx.success === true) {
        this.userAllWithdrawTransactions();
        this.snackBar.open(trnx.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
      } else {
        this.disableApprove = false;
        this.snackBar.open(trnx.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.disableApprove = false;
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }



  userLoginLogs() {
    this.userService.getUserLoginLogsInfo(this.userId).subscribe((logs) => {
      if (logs) {
        this.dataSource = logs;
      }
    });
  }


  // open dialog box of displaying user Wallet address in QR code format
  openQrCode(record: any) {
    this.qrCodeDailogRef = this.dialog.open(DialogComponent, {
      width: '450px',
      height: 'auto',
      disableClose: false,
      data: this.dialogConfig.data = {
        qrCode: true,
        walletDetails: record
      }
    });
  }



  // opening image in dialog box for proper view
  openImageProof(image: any) {
    this.qrCodeDailogRef = this.dialog.open(DialogComponent, {
      width: 'auto',
      height: '550px',
      disableClose: false,
      data: this.dialogConfig.data = {
        proof: true,
        imageProof: image,
      }
    });
  }



  openBankImageProof(bankImage: any) {
    const serverUrl = `${this.serverUrl}/${bankImage}`;
    this.openImageProof(serverUrl);
  }


  // verify front side of id proof
  verifyFrontSide() {
    // tslint:disable-next-line: prefer-const
    let verifyFrontSide = {
      id: this.userId,
      doc_verification: 'verified',
    };
    this.userService.verifyCustomerFrontSide(verifyFrontSide).subscribe((frontSide) => {
      if (frontSide.success === true) {
        this.snackBar.open(frontSide.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.getCustomerKyc();
      } else {
        this.snackBar.open(frontSide.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // reject front side of id proof
  rejectFrontProof() {
    // tslint:disable-next-line: prefer-const
    let rejectFrontProof = {
      id: this.userId,
      type: { doc_verification: 'rejected' },
      rejectFrontProof: true
    };
    this.rejectWithReason(rejectFrontProof);
  }


  // verify back side of id proof
  verifyBackSide() {
    // tslint:disable-next-line: prefer-const
    let verifyBackSide = {
      id: this.userId,
      doc_verification_back: 'verified',
    };
    this.userService.verifyCustomerBackSide(verifyBackSide).subscribe((backSide) => {
      if (backSide.success === true) {
        this.snackBar.open(backSide.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.getCustomerKyc();
      } else {
        this.snackBar.open(backSide.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }



  // reject back side of id proof
  rejectBackProof() {
    // tslint:disable-next-line: prefer-const
    let rejectBackProof = {
      id: this.userId,
      type: { doc_verification_back: 'rejected' },
      rejectBackProof: true
    };
    this.rejectWithReason(rejectBackProof);
  }



  // verify customer selfie proof
  verifyCustomerSelfie() {
    // tslint:disable-next-line: prefer-const
    let verifySelfie = {
      id: this.userId,
      selfie_verification: 'verified',
    };
    this.userService.verifyCustomerSelfie(verifySelfie).subscribe((selfie) => {
      if (selfie.success === true) {
        this.snackBar.open(selfie.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.getCustomerKyc();
      } else {
        this.snackBar.open(selfie.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }




  // reject selfie proof
  rejectSelfieProof() {
    // tslint:disable-next-line: prefer-const
    let rejectSelfie = {
      id: this.userId,
      type: { selfie_verification: 'rejected' },
      rejectSelfie: true
    };
    this.rejectWithReason(rejectSelfie);
  }



  // verify address or reject address
  verifyAddressProof() {
    // tslint:disable-next-line: prefer-const
    let verifyAddress = {
      id: this.userId,
      address_verification: 'verified',
    };
    this.userService.verifyAddressProof(verifyAddress).subscribe((status) => {
      if (status.success === true) {
        this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        this.getCustomerKyc();
      } else {
        this.snackBar.open(status.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // reject address proof
  rejectAddressProof() {
    // tslint:disable-next-line: prefer-const
    let rejectAddress = {
      id: this.userId,
      type: { address_verification: 'rejected' },
      rejectAddress: true
    };
    this.rejectWithReason(rejectAddress);
  }


  // open dialog for give a reason of rejection
  rejectWithReason(rejectedDocType: object) {
    this.qrCodeDailogRef = this.dialog.open(DialogComponent, {
      width: 'auto',
      height: 'auto',
      disableClose: true,
      data: this.dialogConfig.data = {
        reason: true,
        records: rejectedDocType
      }
    });
    this.qrCodeDailogRef.afterClosed().subscribe(() => {
      this.getUserBasicInfo(this.userId);
      this.userBankAccount();
    });
  }


  // prevent user from login
  disableUser(event: MatSlideToggle) {
    // tslint:disable-next-line:prefer-const
    let preventType = {
      typeOfUser: false,
      userId: this.userId,
      preventCustomer: false
    };
    if (event.checked === true) {
      preventType.typeOfUser = true;
      preventType.preventCustomer = true;
      this.rejectWithReason(preventType);
    } else if (event.checked === false) {
      preventType.typeOfUser = false;
      // console.log(preventType);
      this.userService.disableCustomer(preventType).subscribe((prevent) => {
        if (prevent) {
          this.snackBar.open(prevent.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.getUserBasicInfo(this.userId);
        }
      });
    }
  }

}
