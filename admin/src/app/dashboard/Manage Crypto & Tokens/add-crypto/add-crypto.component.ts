import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatRadioChange, MatSelect, MatSnackBar } from '@angular/material';
import { NgInputFileComponent } from 'ng-input-file';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-crypto',
  templateUrl: './add-crypto.component.html',
  styleUrls: ['./add-crypto.component.css']
})
export class AddCryptoComponent implements OnInit {


  cryptoFeeType = 'percentage';
  exchangeFeeType = 'percentage';
  tradeFeeType = 'percentage';


  currencyType = 'crypto';


  @ViewChild('logo') private logo: NgInputFileComponent;


  newCurrencyForm = new FormGroup({
    type: new FormControl(this.currencyType, [Validators.required]),
    fee: new FormControl('', [Validators.required]),
    feein: new FormControl(this.cryptoFeeType, [Validators.required]),
    exchangeFee: new FormControl('', [Validators.required]),
    exchangeFeein: new FormControl(this.exchangeFeeType, [Validators.required]),
    tradeFee: new FormControl('', [Validators.required]),
    tradeFeein: new FormControl(this.tradeFeeType, [Validators.required]),
    logo: new FormControl(''),
    contractAddress: new FormControl(''),
    status: new FormControl('', [Validators.required])
  });


  constructor(
    private userService: UserService,
    private snack: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() {
    this.addDynamicControl();
  }


  addDynamicControl() {
    this.newCurrencyForm.addControl('title', new FormControl('', [Validators.required]));
    this.newCurrencyForm.addControl('symbol', new FormControl('', [Validators.required]));
    this.newCurrencyForm.removeControl('contractAddress');
  }

  removeDynamicControl() {
    this.newCurrencyForm.removeControl('title');
    this.newCurrencyForm.removeControl('symbol');
    this.newCurrencyForm.addControl('contractAddress', new FormControl('', [Validators.required]));
  }

  // convenience getter for easy access to form fields
  get controls() { return this.newCurrencyForm.controls; }

  changeCurrencyType(event: MatSelect) {
    if (event.value === 'crypto') {
      this.addDynamicControl();
    }
    if (event.value === 'fiat') {
      this.addDynamicControl();
      this.newCurrencyForm.patchValue({ fee: 0 });
      this.newCurrencyForm.patchValue({ exchangeFee: 0 });
      this.newCurrencyForm.patchValue({ tradeFee: 0 });
    }
    if (event.value === 'erc20') {
      this.removeDynamicControl();
    }
  }






  titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (let i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    this.newCurrencyForm.patchValue({title: str.join('')});
    return str.join(' ');
  }


  onPickedCurrencyImage({ files }) {
    this.newCurrencyForm.patchValue({ logo: files[0] });
  }


  changeCryptoFeeType(event: MatRadioChange) {
    this.cryptoFeeType = event.value;
    this.newCurrencyForm.patchValue({ feein: this.cryptoFeeType });
  }

  changeExchangeFeeType(event: MatRadioChange) {
    this.exchangeFeeType = event.value;
    this.newCurrencyForm.patchValue({ exchangeFeein: this.exchangeFeeType });
  }

  changeTradeFeeType(event: MatRadioChange) {
    this.tradeFeeType = event.value;
    this.newCurrencyForm.patchValue({ tradeFeein: this.tradeFeeType });
  }




  createCurrency() {
    if (this.newCurrencyForm.invalid) {
      return false;
    } else {
      this.userService.createCurrency(
        this.newCurrencyForm.value.title,
        this.newCurrencyForm.value.type,
        this.newCurrencyForm.value.fee,
        this.newCurrencyForm.value.feein,
        this.newCurrencyForm.value.exchangeFee,
        this.newCurrencyForm.value.exchangeFeein,
        this.newCurrencyForm.value.tradeFee,
        this.newCurrencyForm.value.tradeFeein,
        this.newCurrencyForm.value.logo,
        this.newCurrencyForm.value.contractAddress,
        this.newCurrencyForm.value.symbol,
        this.newCurrencyForm.value.status
      ).subscribe((result) => {
        if (result) {
          if (result.success === true) {
            this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
            // this.newCurrencyForm.reset();
            // this.logo.file.reset();
            this.router.navigate(['/view-currencies']);
          } else if (result.success === false) {
            this.snack.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          }
        }
      });
    }
  }

}
