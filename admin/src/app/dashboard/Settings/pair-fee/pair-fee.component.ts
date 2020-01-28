import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatRadioButton, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-pair-fee',
  templateUrl: './pair-fee.component.html',
  styleUrls: ['./pair-fee.component.css']
})
export class PairFeeComponent implements OnInit {

  cryptoPair: any;

  adminFeeType = 'percentage';
  exmoFeeType = 'percentage';
  b2bxFeeType = 'percentage';

  newPairFeeForm = new FormGroup({
    pairName: new FormControl('', [Validators.required]),
    adminBuyFee: new FormControl('', [Validators.required]),
    adminBuyFeeIn: new FormControl('', [Validators.required]),
    adminSellFee: new FormControl('', [Validators.required]),
    adminSellFeeIn: new FormControl('', [Validators.required]),
    b2bxBuyFee: new FormControl('', [Validators.required]),
    b2bxBuyFeeIn: new FormControl('', [Validators.required]),
    b2bxSellFee: new FormControl('', [Validators.required]),
    b2bxSellFeeIn: new FormControl('', [Validators.required]),
    exmoBuyFee: new FormControl('', [Validators.required]),
    exmoBuyFeeIn: new FormControl('', [Validators.required]),
    exmoSellFee: new FormControl('', [Validators.required]),
    exmoSellFeeIn: new FormControl('', [Validators.required]),
  });

  pairId: any;

  @ViewChild('pairForm') pairForm;

  constructor(
    private adminService: AdminService,
    private snack: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.gettingAllPairs();
    if (this.route.snapshot.routeConfig.path === 'editPairDetails/:pairId') {
      this.pairId = this.route.snapshot.params.pairId;
      this.gettingUniquePairDetails(this.pairId);
    } else {
      this.settingProvidersFeeType();
    }
  }

  settingProvidersFeeType() {
    this.newPairFeeForm.patchValue({ adminBuyFeeIn: this.adminFeeType });
    this.newPairFeeForm.patchValue({ adminSellFeeIn: this.adminFeeType });
    this.newPairFeeForm.patchValue({ b2bxBuyFeeIn: this.b2bxFeeType });
    this.newPairFeeForm.patchValue({ b2bxSellFeeIn: this.b2bxFeeType });
    this.newPairFeeForm.patchValue({ exmoBuyFeeIn: this.exmoFeeType });
    this.newPairFeeForm.patchValue({ exmoSellFeeIn: this.exmoFeeType });
  }



  gettingAllPairs() {
    this.adminService.getAllCurrencyPair().subscribe((pairs) => {
      this.cryptoPair = pairs;
    });
  }

  gettingUniquePairDetails(pairId) {
    this.adminService.getUniquePairDetails(pairId).subscribe((pairDetails) => {
      if (pairDetails) {
        this.adminFeeType = pairDetails.adminBuyFeein;
        this.adminFeeType = pairDetails.adminSellFeein;
        this.b2bxFeeType = pairDetails.b2bxBuyFeein;
        this.b2bxFeeType = pairDetails.b2bxSellFeein;
        this.exmoFeeType = pairDetails.exmoBuyFeein;
        this.exmoFeeType = pairDetails.exmoSellFeein;
        this.newPairFeeForm.addControl('pairId', new FormControl([Validators.required]));
        this.newPairFeeForm.setValue({
          pairId: pairDetails._id,
          pairName: pairDetails.pairName,
          adminBuyFee: pairDetails.adminBuyFee,
          adminBuyFeeIn: pairDetails.adminBuyFeein,
          adminSellFee: pairDetails.adminSellFee,
          adminSellFeeIn: pairDetails.adminSellFeein,
          b2bxBuyFee: pairDetails.b2bxBuyFee,
          b2bxBuyFeeIn: pairDetails.b2bxBuyFeein,
          b2bxSellFee: pairDetails.b2bxSellFee,
          b2bxSellFeeIn: pairDetails.b2bxSellFeein,
          exmoBuyFee: pairDetails.exmoBuyFee,
          exmoBuyFeeIn: pairDetails.exmoBuyFeein,
          exmoSellFee: pairDetails.exmoSellFee,
          exmoSellFeeIn: pairDetails.exmoSellFeein,
        });
      }
    });
  }


  // convenience getter for easy access to form fields
  get controls() { return this.newPairFeeForm.controls; }


  // savaing fee type fiat or in percentage
  changeAdminFeeType(event: MatRadioButton) {
    this.adminFeeType = event.value;
    this.newPairFeeForm.patchValue({ adminBuyFeeIn: this.adminFeeType });
    this.newPairFeeForm.patchValue({ adminSellFeeIn: this.adminFeeType });
  }


  changeB2BXFeeType(event: MatRadioButton) {
    this.b2bxFeeType = event.value;
    this.newPairFeeForm.patchValue({ b2bxBuyFeeIn: this.b2bxFeeType });
    this.newPairFeeForm.patchValue({ b2bxSellFeeIn: this.b2bxFeeType });
  }

  changeExmoFeeType(event: MatRadioButton) {
    this.exmoFeeType = event.value;
    this.newPairFeeForm.patchValue({ exmoBuyFeeIn: this.exmoFeeType });
    this.newPairFeeForm.patchValue({ exmoSellFeeIn: this.exmoFeeType });
  }


  savePairFee() {
    if (this.newPairFeeForm.invalid) {
      return false;
    } else {
      this.adminService.saveProviderPairFee(this.newPairFeeForm.value).subscribe((saveStatus: any) => {
        if (saveStatus) {
          if (saveStatus.success === true) {
            this.snack.open(saveStatus.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
            this.newPairFeeForm.reset();
            this.pairForm.resetForm();
            this.gettingAllPairs();
            this.settingProvidersFeeType();
          }
          if (saveStatus.success === false) {
            this.snack.open(saveStatus.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          }
        }
      });
    }
  }

  updatePairFee() {
    if (this.newPairFeeForm.invalid) {
      return false;
    } else {
      this.adminService.updateProviderPairFee(this.newPairFeeForm.value).subscribe((updatedResult) => {
        if (updatedResult) {
          if (updatedResult.success === true) {
            this.snack.open(updatedResult.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
            this.router.navigate(['/pair-fee']);
          }
          if (updatedResult.success === false) {
            this.snack.open(updatedResult.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          }
        }
      });
    }
  }


}
