import * as express from 'express'
import { getmarketOrder, updatePriceCron, chartData, orderData, orderDataWallebi, receiveOrdersList, marketOrder, sendDataExchange, withdrawalBitcoinFromExchangeTrade, transferBitcoinForExchangeTrade, updateB2bxPriceCron, receiveLimitOrdersList, userCryptoTradeBal, addTradeBalance, feesForProvider } from '../controllers/Wallets/exchangeTradeController';
import { JWTSecret } from '../config/config';
import * as expressJWt from 'express-jwt';
import {transferBitcoinForTrade, withdrawalBitcoinFromTrade} from '../controllers/Wallets/btcController';
import {transferLiteCoinForTrade} from '../controllers/Wallets/liteCoinController';
import {transferTetherForTrading} from '../controllers/Wallets/tetherController';
import {transferEthereumForTrade} from '../controllers/Wallets/ethController';

let router = express.Router();


let auth = expressJWt({
    secret: JWTSecret,
    userProperty: 'user'
});



router.post("/sendDataExchange", auth, sendDataExchange);

  // router.get("/receiveOrdersList/:newpair", function (req, res) {
  // //  userModel.receiveOrdersList(req, res);
  // });
  router.post('/marketOrder', auth, marketOrder);
  
  router.get('/receiveOrdersList', receiveOrdersList);

 // router.get('/receiveLimitOrdersList', receiveLimitOrdersList);

  router.get('/marketOrders ', getmarketOrder);

  router.get("/exchangechart", updatePriceCron);
 
  router.get("/pair/:pair", chartData);

  router.get("/pairFee/:pair", feesForProvider);

  router.get("/orderData/:pair", orderData);

  router.get("/orderDataWallebi/:pair", orderDataWallebi);

  router.post("/withdrawBitcoin", auth, withdrawalBitcoinFromExchangeTrade);

  router.post("/topupBitcoin", auth, transferBitcoinForTrade);

  router.post("/topupLitecoin", auth, transferLiteCoinForTrade);

  //router.post("/topupLitecoin", auth, transferLiteCoinForTrade);

  router.post("/topupTether", auth, transferTetherForTrading);

  router.post("/topupEthereum", auth, transferEthereumForTrade);

  router.get("/exchangePriceBbx/:pair", auth, updateB2bxPriceCron);
  // withdraw bit coin from trade account
  router.post('/withdrawBitcoinFromTrade', auth, withdrawalBitcoinFromTrade);

  // create new balance for trade
router.post('/addTradeBalance', addTradeBalance);


export = router