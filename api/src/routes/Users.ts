import * as express from 'express'

import { userAddressUpload, documentUpload, selfieUploader, userProfilePictureUploader, accountStmtUpload } from '../services/UserService/fileUploder.service';
import { checkUserRegister, checkUserLogin, checkUserForgot, checkResetPassword, checkSendCode, checkSMSCode, checkPersonalDetails, checkIDProof, checkChangePassword, checkSMSCode2FALogin, checkChangePasswordAuthy } from '../services/UserService/validators.service';
import { sendVerificationCode, verifyMobile, personalDetails, idProofVerification, selfieUpload, KYCStatus, personalDetailsUpdationAfterRejection, idProofVerificationAfterRejection, selfieUploadAfterRejection, createBankAccountWithKYC } from '../controllers/users/kyc.controller';
import { userRegister, emailVerification, login, deviceVerification, resetPassword, forgetPassword, verifyLoginOtp, userProfile, updateLanguage, getReferralUser, chanageCurrency, resendEmailForVerification } from '../controllers/users/user.controller';
import { uploadProfilePicture, updatePersonalDetails } from '../controllers/users/userProfile.controller';
import { changePassword, twoFAForLogin, twoFAForTrade, twoFAForWithdraw, twoFAForGoogle, getGoogleQRCode, twoFAGoogleVerify, twoFAVerifyGoogle, twoFAForPasswordChange, statusTwoFALogin, statusTwoFAWithdraw, statusTwoFATrade, statusTwoFAChangePassword, chnageAuthyPassword } from '../controllers/users/user.security.controller';
import { createBanckAccount, getBanKAccount } from '../controllers/users/userBankAccount.controller';
import { JWTSecret } from '../config/config';
import * as expressJWt from 'express-jwt';
import { genrateWalletForUser, getUserWallet, genrateTradeWallet, getUserTradeWallet, activateUserToken } from '../controllers/Wallets/userCryptoInfo.controller';
import { userFiatCurrencyWallet, getUserFiatWallet } from '../controllers/Wallets/euroController';

let router = express.Router();

let auth = expressJWt({
    secret: JWTSecret,
    userProperty: 'user'
});

// user registeration route
router.post('/userRegistration', checkUserRegister, userRegister);

// resend email for verification
router.post('/resendEmail', resendEmailForVerification);

// user email verification route 
router.get('/emailVerification/:token', emailVerification);

// user login route
router.post('/userLogin', checkUserLogin, login);


// user login route if 2FA enable check OTP
router.post('/verifyLoginOTP', checkSMSCode2FALogin, verifyLoginOtp);

// user device verification route
router.post('/deviceVerification', deviceVerification);

// user forgot password
router.post('/forgetPassword', checkUserForgot, forgetPassword);

// user reset password route 
router.post('/reset-password', checkResetPassword, resetPassword);

// getting user profile
router.get('/getProfile', auth, userProfile);

// getting user kyc status
router.get('/userKYCStatus', auth, KYCStatus);


// user send verification code for mobile verification route
router.post('/sendVerificationCode', checkSendCode, auth, sendVerificationCode);

// user mobile verification 
router.post('/verifyMobile', checkSMSCode, auth, verifyMobile);


// user profile picture upload route
router.post('/updateProfilePicture', auth, uploadProfilePicture);

// user personal detail verification
router.post('/personalDetails', auth, userAddressUpload.single('useraddressimage'), personalDetails);


// user personal detail updation after rejection
router.post('/personalDetailsAfterRejection', auth, userAddressUpload.single('useraddressimage'), personalDetailsUpdationAfterRejection);


// user personal details updation route
router.post('/personalDetailsUpdation', auth, userAddressUpload.single('useraddressimage'), updatePersonalDetails);


// user id proof front and back third step of kyc
let idProof = documentUpload.fields([{ name: 'id_proof_front' }, { name: 'id_proof_back' }]);
router.post('/idProofeVerification', auth, idProof, idProofVerification);


router.post('/idProofAfterRejection', auth, idProof, idProofVerificationAfterRejection);

// user selfie upload route
router.post('/selfieUpload', auth, selfieUploader.single('userSelfie'), selfieUpload);

// upload selfie after rejection
router.post('/selfieAfterRejection', auth, selfieUploader.single('userSelfie'), selfieUploadAfterRejection);

// bank account creation with selfie
router.post('/createBankAccountWithKYC', auth, accountStmtUpload.single('bankProof'), createBankAccountWithKYC);

// user chnage password route
router.post('/changePassword', checkChangePassword, auth, changePassword);

// user chnage password when 2FA enable
router.post('/changePasswordVerifyOTP', auth, chnageAuthyPassword);

// user two factor enable/disable
router.post('/twoFAForLogin', auth, twoFAForLogin);

// user two factor login enable/disable status route
router.get('/statusTwoFALogin', auth, statusTwoFALogin);


// user two factor for withdraw
router.post('/twoFAForWithdraw', auth, twoFAForWithdraw);

// user two factor withdraw enable/disable status route
router.get('/statusTwoFAWithdraw', auth, statusTwoFAWithdraw);

// user two factor for trade
router.post('/twoFAForTrade', auth, twoFAForTrade);

// user two factor trade  enable/disable status route
router.get('/statusTwoFAForTrade', auth, statusTwoFATrade);

// user two factor for password change
router.post('/twoFAForPasswordChange', auth, twoFAForPasswordChange);

// user two factor passwordchange enable/disable status password change
router.get('/statusTwoFAChangePassword', auth, statusTwoFAChangePassword);

// user google QR code route
router.get('/getUserGoogleQRCode', auth, getGoogleQRCode)


// user two factor google verify route
router.post('/twoFAGoogleVerify', auth, twoFAGoogleVerify)

// user two factor verify google route
router.post('/twoFAVerifyGoogle', auth, twoFAVerifyGoogle);

// user two factor for google route
router.post('/twoFAForGoogle', auth, twoFAForGoogle);


// user create bank account route 
router.post('/createBankAccount', auth, accountStmtUpload.single('ac_statement'), createBanckAccount);

// get user bank account details
router.get('/bankAccount', auth, getBanKAccount);

// update user language
router.post('/updateLanguage', auth, updateLanguage);

// update user currency
router.post('/updateCurrency', auth, chanageCurrency);


// get all user with referral register
router.get('/getReferralRegister', auth, getReferralUser);





// genrate wallet for user
router.get('/genrateWalletForUser', auth, genrateWalletForUser);


// display wallet for user
router.get('/displayWalletForUser', auth, getUserWallet);


// activating user token if etherum is activated
router.get('/activatingToken', auth, activateUserToken);

// displaying trade wallet for user
router.get('/displayTradeWalletForUser', auth, getUserTradeWallet);


// genrating fiat wallet for user
router.get('/fiatCurrencyWallet', auth, userFiatCurrencyWallet);

// display fiat wallett for user
router.get('/displayUserFiatWallet', auth, getUserFiatWallet);



export = router

