import { Injectable } from '@angular/core';
import { Observable, from, zip } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserKycVerificationService {

  constructor(private apiService: ApiService, private http: HttpClient) { }


  // getting all country list for issuer country dropdown
  public getCountryList() {
    return this.http.get('https://restcountries.eu/rest/v2/all');
  }


  // getting user kyc status
  public getKycStatus(): Observable<any> {
    return this.apiService.request('get', 'userKYCStatus');
  }

  // send verifacation otp for verification of user mobile
  public sendVerificationCode(mobile): Observable<any> {
    return this.apiService.request('post', 'sendVerificationCode', mobile);
  }


  // verify OTP with user OTP
  public verifyOTP(OTP): Observable<any> {
    return this.apiService.request('post', 'verifyMobile', OTP);
  }


  // saving users personal details
  public persoanlDetail(
    gender: string, dob: string, houseNo: string, street: string, city: string, district: string, zipCode: string,
    country: string, useraddressimage: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('gender', gender);
    formData.append('dob', dob);
    formData.append('houseNo', houseNo);
    formData.append('street', street);
    formData.append('city', city);
    formData.append('district', district);
    formData.append('zipCode', zipCode);
    formData.append('country', country);
    formData.append('useraddressimage', useraddressimage);
    return this.apiService.request('post', 'personalDetails', formData);
  }



  // saving users personal details
  public updateAfterRejection(
    gender: string, dob: string, houseNo: string, street: string, city: string, district: string, zipCode: string,
    country: string, useraddressimage: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('gender', gender);
    formData.append('dob', dob);
    formData.append('houseNo', houseNo);
    formData.append('street', street);
    formData.append('city', city);
    formData.append('district', district);
    formData.append('zipCode', zipCode);
    formData.append('country', country);
    formData.append('useraddressimage', useraddressimage);
    return this.apiService.request('post', 'personalDetailsAfterRejection', formData);
  }


  // update user address details
  public updateAddressProof(
    houseNo: string, street: string, city: string, district: string, zipCode: string,
    country: string, useraddressimage: File
  ): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('houseNo', houseNo);
    formData.append('street', street);
    formData.append('city', city);
    formData.append('district', district);
    formData.append('zipCode', zipCode);
    formData.append('country', country);
    formData.append('useraddressimage', useraddressimage);
    return this.apiService.request('post', 'personalDetailsUpdation', formData);
  }


  // saving user id proof for address proof verification
  // tslint:disable-next-line:variable-name
  public idProofSubmit(countryid: string, idnumber: string, id_proof_front: File, id_proof_back: File) {
    const formData: FormData = new FormData();
    formData.append('countryid', countryid);
    formData.append('idnumber', idnumber);
    formData.append('id_proof_front', id_proof_front);
    formData.append('id_proof_back', id_proof_back);
    return this.apiService.request('post', 'idProofeVerification', formData);
  }



  // saving user id proof for address proof verification
  // tslint:disable-next-line:variable-name
  public idProofUpdation(countryid: string, idnumber: string, id_proof_front: File, id_proof_back: File) {
    const formData: FormData = new FormData();
    formData.append('countryid', countryid);
    formData.append('idnumber', idnumber);
    formData.append('id_proof_front', id_proof_front);
    formData.append('id_proof_back', id_proof_back);
    return this.apiService.request('post', 'idProofAfterRejection', formData);
  }


  // saving user selfie
  public selfieUpload(userSelfie: File) {
    const formData: FormData = new FormData();
    formData.append('userSelfie', userSelfie);
    return this.apiService.request('post', 'selfieUpload', formData);
  }



  // saving user selfie after rejection
  public selfieUploadAfterRejection(userSelfie: File) {
    const formData: FormData = new FormData();
    formData.append('userSelfie', userSelfie);
    return this.apiService.request('post', 'selfieAfterRejection', formData);
  }



  // saving user bank details at the KYC
  public createBankAccount(
    accountHolderFirstname: string,
    accountHolderLastname: string,
    bankAccountName: string,
    branchName: string,
    accountNo: string,
    swiftCode: string,
    currency: string,
    bankProof: File
    ) {
    const formData: FormData = new FormData();
    formData.append('accountHolderFirstname', accountHolderFirstname);
    formData.append('accountHolderLastname', accountHolderLastname);
    formData.append('bankAccountName', bankAccountName);
    formData.append('branchName', branchName);
    formData.append('accountNo', accountNo);
    formData.append('swiftCode', swiftCode);
    formData.append('currency', currency);
    formData.append('bankProof', bankProof);
    return this.apiService.request('post', 'createBankAccountWithKYC', formData);
  }
}
