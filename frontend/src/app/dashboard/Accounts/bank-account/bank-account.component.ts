import { Component, OnInit, Renderer2 } from '@angular/core';
import { BankAccountService } from 'src/app/services/bank-account.service';
import { MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PusherService } from 'src/app/services/pusher.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bank-account',
  templateUrl: './bank-account.component.html',
  styleUrls: ['./bank-account.component.css']
})
export class BankAccountComponent implements OnInit {
  accountStatement: any;
  currencyType = 'euro';
  userBankCard: any;
  accontHolderFirstName: any;
  accontHolderLastName: any;
  cardNumber: any;
  swiftCode: any;
  acBankName: any;
  status: any;
  branchName: any;
  iban: any;
  currency: any;

  constructor(
    private bankService: BankAccountService,
    private snackBar: MatSnackBar,
    private pusher: PusherService,
    private render: Renderer2,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
  }

  // create bank account form
  createBankAccountForm = new FormGroup({
    ac_holder_firstname: new FormControl('', [
      Validators.required,
      Validators.pattern('([a-zA-Z]{3,30}s*)+')
    ]),
    ac_holder_lastname: new FormControl('', [
      Validators.required,
      Validators.pattern('([a-zA-Z]{3,30}s*)+')
    ]),
    ac_holdername: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z ]{2,50}$')
    ]),
    branch_name: new FormControl('', [
      Validators.required,
      Validators.pattern('^[-_ a-zA-Z0-9]+$')
    ]),
    account_no: new FormControl('', [Validators.required]),
    swift_code: new FormControl('', [Validators.required]),
    currency: new FormControl('', [Validators.required]),
    ac_statement: new FormControl('', [Validators.required])
  });

  ngOnInit() {




    this.bankService.getBankAccount().subscribe(bank => {
      if (bank) {
        this.userBankCard = bank;
        if (this.userBankCard[0]) {
          this.acBankName = this.userBankCard[0].ac_holdername;
          this.currency = this.userBankCard[0].currency;
          this.accontHolderFirstName = this.userBankCard[0].ac_holder_firstname;
          this.accontHolderLastName = this.userBankCard[0].ac_holder_lastname;
          this.status = this.userBankCard[0].status;
          this.iban = this.userBankCard[0].account_no;
          this.branchName = this.userBankCard[0].branch_name;
          this.cardNumber = this.userBankCard[0].card_no;
          this.swiftCode = this.userBankCard[0].swift_code;
        }
      }
    });
  }

  // picking user address proof and patching it to personal details form and showing preview
  onAccountStatementPicked(event: any) {
    const file = (event.target as HTMLInputElement).files[0];
    this.createBankAccountForm.patchValue({ ac_statement: file });
    this.createBankAccountForm.get('ac_statement').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.accountStatement = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // getting controls of create bank account form validation
  get controls() {
    return this.createBankAccountForm.controls;
  }

  // create bank account function
  createAccount() {
    if (this.createBankAccountForm.invalid) {
      return false;
    } else {
      this.bankService
        .createBankAccount(
          this.createBankAccountForm.value.account_no,
          this.createBankAccountForm.value.swift_code,
          this.createBankAccountForm.value.card_no,
          this.createBankAccountForm.value.ac_holdername,
          this.createBankAccountForm.value.ac_holder_firstname,
          this.createBankAccountForm.value.ac_holder_lastname,
          this.createBankAccountForm.value.currency,
          this.createBankAccountForm.value.branch_name,
          this.createBankAccountForm.value.ac_statement
        )
        .subscribe(
          result => {
            if (result.success === false) {
              this.snackBar.open(result.msg, 'X', {
                duration: 4000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'end'
              });
            }
            if (result.success === true) {
              this.createBankAccountForm.reset();
              this.accountStatement = '';
              this.snackBar.open(result.msg, 'X', {
                duration: 4000,
                panelClass: ['info-snackbar'],
                horizontalPosition: 'end'
              });
            }
            if (result[0]) {
              this.snackBar.open(result[0], 'X', {
                duration: 4000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'end'
              });
            }
          },
          error => {
            this.snackBar.open(error.message, 'X', {
              duration: 4000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'end'
            });
          }
        );
    }
  }

  openCard(card: any) {
    this.acBankName = card.ac_holdername;
    this.currency = card.currency;
    this.accontHolderFirstName = card.ac_holder_firstname;
    this.accontHolderLastName = card.ac_holder_lastname;
    this.status = card.status;
    this.iban = card.account_no;
    this.branchName = card.branch_name;

    this.cardNumber = card.card_no;
    this.swiftCode = card.swift_code;
  }


  enableDisaleCard(event: any) {
    console.log(event);
  }

}
