import * as express from 'express';
import { JWTSecret } from '../config/config';
import * as expressJWt from 'express-jwt';
import { activateETH, sendEthToOther, transferEthereumForTrade, withdrawalEthFromTrade } from '../controllers/Wallets/ethController';
import { activateBTC, getBTCTnxFee, sendBtcToOther, transferBitcoinForTrade, withdrawalBitcoinFromTrade } from '../controllers/Wallets/btcController';
import { activateXRP, sendRippleToOther, rippleTransactionFee } from '../controllers/Wallets/xrpController';
import { activateXLM, stellarTransactionFee, sendStellarToOther } from '../controllers/Wallets/xlmController';
import { activateMonero, sendXmrToOther } from '../controllers/Wallets/moneroController';
import { activateTether, sendUsdtToOther, tetherTransactionFee, transferTetherForTrading, withdrawUsdtFromTrade } from '../controllers/Wallets/tetherController';
import { activateLiteCoin, sendLtcToOther, ltcFee, transferLiteCoinForTrade, withdrawLitecoinFromTrade } from '../controllers/Wallets/liteCoinController';
import { activateBCH, bchTnxFee, sendBCHToOther } from '../controllers/Wallets/bchController';
import { sendEmailCode, sendReceiveAllTrx, sendReciveCryptoTnxUser, sendReciveTradeTnxUser } from '../controllers/Wallets/userCryptoInfo.controller';
import { getYekpayExchangeRate, creditEuroAmount, updateTransaction, userFiatTransactions } from '../controllers/Wallets/euroController';

import { receiveLimitOrdersList, receiveLimitOrdersListCompleted, userCryptoTradeBal } from '../controllers/Wallets/exchangeTradeController';
import { sellCryptoTrade, buyCryptoTrade } from '../controllers/Trade Buy-Sell/buy-sell.controller';
import { sendEthereumTokenToOthers } from '../controllers/Wallets/token.controller';


let router = express.Router();

let auth = expressJWt({
    secret: JWTSecret,
    userProperty: 'user'
});

// activate all currency address for user
router.post('/activateCryptoWallet', auth, (req, res, next) => {
    let { symbol, type } = req.body;
    switch (symbol) {
        case 'BTC':
            activateBTC(req, res, next);
            break;
        case 'ETH':
            activateETH(req, res, next);
            break;
        case 'USDT':
            activateTether(req, res, next);
            break;
        case 'LTC':
            activateLiteCoin(req, res, next);
            break;
        case 'XMR':
            activateMonero(req, res, next);
            break;
        case 'BCH':
            activateBCH(req, res, next);
            break;
        case 'XRP':
            activateXRP(req, res, next);
            break;
        case 'XLM':
            activateXLM(req, res, next);
            break;
        default:
            if (type === 'erc20') {
                activateETH(req, res, next);
            }
    }
});


router.post('/transferCryptoOthers', auth, (req, res, next) => {
    let { symbol, contractAddress, type } = req.body;
    switch (symbol) {
        case 'BTC':
            sendBtcToOther(req, res);
            break;
        case 'ETH':
            sendEthToOther(req, res, next);
            break;
        case 'USDT':
            sendUsdtToOther(req, res);
            break;
        case 'LTC':
            sendLtcToOther(req, res);
            break;
        case 'XMR':
            sendXmrToOther(req, res);
            break;
        case 'BCH':
            sendBCHToOther(req, res, next);
            break;
        case 'XRP':
            sendRippleToOther(req, res);
            break;
        case 'XLM':
            sendStellarToOther(req, res, next);
            break;
        default:
            if (type === 'erc20' && contractAddress) {
                // console.log(req.body);
                sendEthereumTokenToOthers(req, res, next);
            }
    }
});



// getting send receive transaction of bitcoin from the database
router.get('/sendReceiveCryptoTxn', auth, sendReciveCryptoTnxUser);


// getting send receive transaction of bitcoin from the database
router.get('/sendReceiveTradeTxn', auth, sendReciveTradeTnxUser);


// top up crypto currencies for trading
router.post('/topupCryptoForTrade', auth, (req, res, next) => {
    let { symbol } = req.body;
    switch (symbol) {
        case 'BTC':
                transferBitcoinForTrade(req, res, next);
            break;
        case 'ETH':
            transferEthereumForTrade(req, res, next);
            break;
        case 'USDT':
            transferTetherForTrading(req, res, next);
            break;
        case 'LTC':
            transferLiteCoinForTrade(req, res, next);
            break;

        default:
            res.status(200).json({success: false, msg: "Something went wrong!"});
    }
});


// top up crypto currencies for trading
router.post('/withdrawCryptoForTrade', auth, (req, res, next) => {
    let { symbol } = req.body;
    switch (symbol) {
        case 'BTC':
            withdrawalBitcoinFromTrade(req, res, next);
            break;
        case 'ETH':
            withdrawalEthFromTrade(req, res, next);
            break;
        case 'USDT':
            withdrawUsdtFromTrade(req, res, next);
            break;
        case 'LTC':
            withdrawLitecoinFromTrade(req, res, next);
            break;

        default:
            res.status(200).json({success: false, msg: "Something went wrong!"});
    }
});


// send email for get code
router.post('/sendCodeOnEmail', auth, sendEmailCode);


// fetching all transaction of all currencies
router.get('/sendReceiveAllTnx', auth, sendReceiveAllTrx);


// getting yekpay currency exchange rate
router.post('/currencyExchangeRate', auth, getYekpayExchangeRate);


// credit euro amount
router.post('/creditFiatAmount', auth, (req, res, next) => {
    let { symbol } = req.body;
    switch (symbol) {
        case 'EUR':
            creditEuroAmount(req, res, next);
            break;
        default:
            res.status(200).json({success: false, msg: 'Something went wrong!', type: 'Only Euro Allow'})
            break;
    }
});



// getting user fiat transactions
router.get('/userFiatTransactions', auth, userFiatTransactions);




// verify user payment status
router.post('/updateTransaction', auth, updateTransaction);

// fetching ltc transaction fee
router.get('/btcTransactionFee', auth, getBTCTnxFee);












// getting transaction fee for tether
router.get('/usdtTransactionFee', auth, tetherTransactionFee);



// fetching ltc transaction fee
router.get('/transactionFeeLTC', auth, ltcFee);






// getting transaction fee for monero
router.get('/xmrTransactionFee', auth);


// transaction fee of bch
router.get('/bchTnxFee', auth, bchTnxFee);

// getting transaction fee for ripple
router.get('/xrpTransactionFee', auth, rippleTransactionFee);

// getting transaction fee of stellar
router.get('/stellarTransactionFee', auth, stellarTransactionFee)







router.get('/receiveLimitOrdersList', auth, receiveLimitOrdersList);

router.get('/receiveLimitOrdersListCompleted', auth, receiveLimitOrdersListCompleted);


//to get trade balance for any crypto 
router.post("/getTradeBalance", auth, userCryptoTradeBal);


// buying crypto currency
router.post('/buyCryptoTrade', auth, buyCryptoTrade);


// selling crypto amount
router.post('/sellCryptoTrade', auth, sellCryptoTrade);









export = router
