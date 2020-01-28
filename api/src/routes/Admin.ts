import * as express from 'express'
let router = express.Router();
import * as expressJWt from 'express-jwt';
import { JWTSecret } from '../config/config';
import { adminRegister, adminLogin, getAdminProfile, getUserTopupForTrade, getUserWithdrawForTrade, getUserTopupRequests, transferCryptoToUsers, genrateWallet, activateAdminToken } from '../controllers/admin/Admin-Users/admin.controller';
import {
    allUsersDetails,
    userCompleteProfile,
    userLoginLogsInfo,
    approveOrFreezUserProfile,
    disableCustomer,
    verifyAddressProof,
    verifyCustomerSelfie,
    verifyCustomerBackProof,
    verifyCustomerFrontProof,
    rejectAddressProof,
    rejectCustomerFrontProof,
    rejectCustomerBackProof,
    rejectCustomerSelfie,
    userAllSendReceiveTnx,
    userBankAccount,
    changeBankAccountStatus,
    userWallets,
    userTradeWallets,
} from '../controllers/admin/Admin-Users/user.controller';
import { createNewEmailTemplate, getAllEmailTemplate, getUniqueEmailTemplate, editEmailTemplate, deleteEmailTemplate } from '../controllers/admin/Admin-Users/emailTemplate.controller';
import { activateAdminBitcoinWallet, sendBitcoinToOther } from '../controllers/admin/Admin Wallets/admin.btc.controller';
import { getAdminWallet, sendReciveCryptoTnxAdmin } from '../controllers/admin/Admin Wallets/admin.info.controller';
import { createCurrency, getAllCurrenciesAdmin, changeCurrencyStatus, changeCurrencyTradeStatus, changeCurrencyBuySellStatus } from '../controllers/admin/Admin-Users/currency.controller';
import { currencyLogo, emailTemplateImageUpload } from '../services/UserService/fileUploder.service';
import { activateAdminEthereumWallet } from '../controllers/admin/Admin Wallets/admin.eth.controller';
import { activateAdminTether } from '../controllers/admin/Admin Wallets/admin.usdt.controller';
import { activateAdminLiteCoin } from '../controllers/admin/Admin Wallets/admin.ltc.controller';
import { activateAdminMoneroWallet } from '../controllers/admin/Admin Wallets/admin.xmr.controller';
import { activateAdminBitcashWallet } from '../controllers/admin/Admin Wallets/admin.bch.controller';
import { activateAdminRipple } from '../controllers/admin/Admin Wallets/admin.xrp.controller';
import { activateAdminStellar } from '../controllers/admin/Admin Wallets/admin.xlm.controller';
import { activatedProvider, changeProviderStatus, saveProvidersPairFee, getAllPairsProvidersFee, uniquePairDetails, updateProvidersPairFee, updatePairStatus } from '../controllers/Trade Buy-Sell/buy-sell.controller';
import { getAllPairs } from '../controllers/Wallets/exchangeTradeController';
import { adminFiatCurrencyWallet, getAdminFiatWallet } from '../controllers/Wallets/euroController';
import { transferBitcoinFromAdminToUser } from '../controllers/Wallets/btcController';
import { transferEthereumFromAdminToUser } from '../controllers/Wallets/ethController';
import { transferLitecoinFromAdminToUser } from '../controllers/Wallets/liteCoinController';
import { transferTetherFromAdminToUser } from '../controllers/Wallets/tetherController';


let auth = expressJWt({
    secret: JWTSecret,
    userProperty: 'admin'
});



// create new admin with API
router.post('/adminSignup', adminRegister);

// login admin 
router.post('/adminLogin', adminLogin);

// genrate admin wallet
router.get('/genrateWallet', auth, genrateWallet);

// activating token for admin 
router.get('/activatingAdminToken', auth, activateAdminToken);

// display wallet for admin
router.get('/displayWallet', auth, getAdminWallet);

// getting admin Profile
router.get('/adminProfile', auth, getAdminProfile)

// getting all user
router.get('/allUsers', auth, allUsersDetails);

// getting all profile info of a single user
router.get('/userDetails/:id', auth, userCompleteProfile);


// getting main wallet info of a single user
router.get('/userWallets/:id', auth, userWallets);


// getting trade wallet info of a single user
router.get('/userTradeWallets/:id', auth, userTradeWallets);


// getting all login logs info of a single user
router.get('/userLoginLogs/:id', auth, userLoginLogsInfo);


// approve or freez user profile
router.post('/approveProfile', auth, approveOrFreezUserProfile);

// verify customer id proof front side
router.post('/verifyCustomerFrontSide', auth, verifyCustomerFrontProof);


// reject customer id proof front side
router.post('/rejectCustomerFrontSide', auth, rejectCustomerFrontProof);


// verify customer id proof back side
router.post('/verifyCustomerBackSide', auth, verifyCustomerBackProof);


// verify customer id proof back side
router.post('/rejectCustomerBackSide', auth, rejectCustomerBackProof);

// verify customer sefie
router.post('/verifyCustomerSelfie', auth, verifyCustomerSelfie);

// verify customer sefie
router.post('/rejectCustomerSelfie', auth, rejectCustomerSelfie);

// verify customer address prrof
router.post('/verifyAddressProof', auth, verifyAddressProof);

// reject customer address prrof
router.post('/rejectAddressProof', auth, rejectAddressProof);

// enable and disable user account
router.post('/disableCustomer', auth, disableCustomer);

// fetch all the transaction of a user
router.get('/userAllTransaction', auth, userAllSendReceiveTnx);

// fetch bank account of the user
router.get('/userBankAccount/:userId', auth, userBankAccount);

// mark customer bank account pending/reject/approve
router.post('/changeBankAccountStatus/:userId', auth, changeBankAccountStatus);

// create new email template
router.post('/createTemplate', auth, createNewEmailTemplate);

// getting all email template
router.get('/allEmailTemplate', auth, getAllEmailTemplate);

// get email template on the basis of email id
router.get('/emailTemplate/:templateId', auth, getUniqueEmailTemplate);


// get and update email template
router.post('/updateEmailTemplate', auth, editEmailTemplate)


// delete email template
router.get('/deleteEmailTemplate/:templateId', auth, deleteEmailTemplate);








// activate admin bitcoin wallets route

router.post('/activateCrypto', auth, (req, res, next) => {
    let { currencyId, symbol, title, type } = req.body;
    switch (symbol) {
        case 'BTC':
            activateAdminBitcoinWallet(req, res, next);
            break;
        case 'ETH':
            activateAdminEthereumWallet(req, res, next);
            break;
        case 'USDT':
            activateAdminTether(req, res, next);
            break;
        case 'LTC':
            activateAdminLiteCoin(req, res, next);
            break;
        case 'XMR':
            activateAdminMoneroWallet(req, res, next);
            break;
        case 'BCH':
            activateAdminBitcashWallet(req, res, next);
            break;
        case 'XRP':
            activateAdminRipple(req, res, next);
            break;
        case 'XLM':
            activateAdminStellar(req, res, next);
            break;
        default:
            if (type === 'erc20') {
                activateAdminEthereumWallet(req, res, next);
            }
    }
});




// getting send receive transaction of bitcoin from the database
router.get('/sendReceiveCryptoTxnAdmin', auth, sendReciveCryptoTnxAdmin);


// genrating admin fiat wallet
router.get('/createAdminFiatWallet', auth, adminFiatCurrencyWallet);

// fetching & displaying admin fiat wallet
router.get('/fetchAdminFiatWallet', auth, getAdminFiatWallet);



// getting topup orders details of particular user  
router.get('/userAllTopupTransaction', auth, getUserTopupForTrade)

// getting  orders details of particular user  
router.get('/userAllWithdrawTransaction', auth, getUserWithdrawForTrade)

// getting topup details of particular user  
router.get('/userAllTopupreqTransaction', auth, getUserTopupRequests)

// send bitcoin to other users
router.post('/transferCryptoToUsers', auth, (req, res, next) => {
    let { cryptoType, cryptoAmount, recordId, userId } = req.body;
    switch (cryptoType) {
        case 'BTC':
            transferBitcoinFromAdminToUser(req, res, next);
            break;
        case 'ETH':
            transferEthereumFromAdminToUser(req, res, next);
            break;
        case 'LTC':
            transferLitecoinFromAdminToUser(req, res, next);
            break;
        case 'USDT':
            transferTetherFromAdminToUser(req, res, next);
            break;

        default:
            res.status(200).json({success: false, msg: 'Something went wrong!', type: 'no case '});
            break;
    }
});






// create currencies for user
router.post('/createCurrency', currencyLogo.single('logo'), auth, createCurrency);

// fetch all currencies
router.get('/fetchCurrencies', auth, getAllCurrenciesAdmin);

router.get('/changeCurrencyStatus', auth, changeCurrencyStatus);

// change trade satus in any currency
router.get('/changeTradeStatus', auth, changeCurrencyTradeStatus);

// change buy&sell satus in any currency
router.get('/changeBuyAndSellStatus', auth, changeCurrencyBuySellStatus);


// getting liquidity provider from database & displaying them to admin
router.get('/activatedLiquidity', auth, activatedProvider);

// change provider status 
router.post('/changeProviderStatus', auth, changeProviderStatus);


// getting all pairs for adding fees
router.get('/getAllPairs', auth, getAllPairs);

// saving pair fee in the database for all availabe providers
router.post('/saveProvidersPairFee', auth, saveProvidersPairFee);

// getting all provider's pair fee from our DB
router.get('/getAllPairsProvidersFee', auth, getAllPairsProvidersFee);

// getting unique pair details
router.get('/getUniquePairDetails', auth, uniquePairDetails);

// updating fee of providers
router.post('/updateProviderFee', auth, updateProvidersPairFee);

// updating pair active to inactive
router.get('/updatePairStatus', auth, updatePairStatus);

router.post('/emailTemplateImage', emailTemplateImageUpload.single('UploadFiles'), (req, res) => {
    res.json('uploaded');
});

// removing image which uploaded from rich text editor
router.delete('/removeImage', (req, res) => {
    res.json({ msg: 'remove done' });
});

export = router
