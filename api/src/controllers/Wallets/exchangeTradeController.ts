var mongoose = require('mongoose');
const WebSocket = require('ws');

import * as request from 'request';
import { MarketOrder } from '../../db/models/exchangeSchema/marketOrder.model';
import { LimitOrder } from '../../db/models/exchangeSchema/limitOrder.model';
import { ExchangeTrade } from "../../db/models/Wallets/exchange.trade.model";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { Currency } from "../../db/models/Wallets/currencies.model";

import { createMultiSigWallet, getBTCNetworkFee, getBTCBalance, transferBTCAmount, setBTCTxFee, getBTCListTransaction, moveBTCAmount, getBTCTradeBalance } from "../../services/WalletService/btc.Service";
import { User } from "../../db/models/users/users.model";
import { UserProfile } from '../../db/models/users/userProfile.model';
import { SettingSchema } from "../../db/models/Wallets/setting.model";
import { BbxPairSchema } from "../../db/models/exchangeSchema/bbxpair.model";
import { AdminDetailsForTrade } from "../../config/config";
import { Trade } from "../../db/models/Wallets/trade.model";
import { AdminQuickExchangeWallet } from "../../db/models/Wallets/adminQuickExchange.model";
import { newAccount, getBalance, unlockAddress, sendTransaction, getEstimatedGas, validAddress, getTransactionCount, } from "../../services/WalletService/eth.Service";
import { log } from 'util';
import { transferAmount } from '../../services/WalletService/liteCoin.service';
import { userCryptoTradeBalance } from '../../services/WalletService/trade.service';
import { TradeWallet } from '../../db/models/Wallets/trade.wallet.model';
import { ioSocketss } from '../..';
import { join } from 'path';
import { ProvidersPairFee } from '../../db/models/exchangeSchema/provider.pair.fee.model';
import { init_exmo, api_query, cancelOrder, fetchUserInfo } from "../../services/Liquidity Service/exmo.service";
import { AllowTradeByAdmin } from '../../db/models/Wallets/allow.trade.provider.model';
import { TradeFromLiquidity } from '../../db/models/Wallets/trade.liquidity.model';
import { sendOrderToEmxmoForExchange } from '../Trade Buy-Sell/liqudity.controller';

var uniqueid = require('uniqueid');
const uniqueString = require('unique-string');
init_exmo({ key: 'K-5a08deabfbc5910737601c1a1cdc764a255ab3bb', secret: 'S-8fbb575d4773a42120441d936df10fef793245a5' });

var updatePriceCron = async function (req, res) {

	//var WebSocket = require('ws');
	//res.status(200).send({sellPrice:3010,buyPrice:3108});
	var options = {
		method: 'POST',
		url: 'https://api.exmo.com/v1/ticker/',
		headers:
		{
			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
			'User-Agent': 'Mozilla/5.0'
		},
	};

	request(options, async function (error, respo, body) {
		//res.send(response.bodyETH_EUR);

		try {
			var pairArray = [];
			var pairArrayObj = {};
			var availablePairArray = [];
			var arr1 = ['BTC', 'ETH', 'BCH', 'XLM', 'XMR', 'LTC', 'XRP', 'USDT'];
			var arr2 = ['BTC', 'ETH', 'BCH', 'XLM', 'XMR', 'LTC', 'XRP', 'USDT'];
			arr1.forEach((arr1Element) => {
				arr2.forEach((arr2Element) => {
					if (arr1Element !== arr2Element) {
						pairArray.push(arr1Element + "_" + arr2Element);
					}
				})
			})

			//	console.log("PAIR ARRAY", pairArray, pairArray.length)

			//	return;

			let response = JSON.parse(respo.body);
			if (!response.error) {


				//console.log('respo.body',response.error)
				//console.log('response_response',Object.keys(response))
				//res.send(response.ETH_EUR.buy_price);

				pairArray.forEach((pairArrayElement) => {
					if (response[pairArrayElement]) {
						//	console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL", pairArrayElement, response[pairArrayElement])
						pairArrayObj[pairArrayElement] = response[pairArrayElement];
						availablePairArray.push(pairArrayElement);
					}
					// response[pairArrayElement]
				})
				//	console.log('PAIR ARRAY OBJECT', pairArrayObj);

				res.send({ status: "true", pairArray: availablePairArray, pairArrayObjData: pairArrayObj });
			} else {
				let errors = response.error;
				res.send({ status: "false", errors });
			}
		} catch (error) {
			console.log(error);
		}
	});


}



var updateOrdersCron1 = async function (req, res) {
	console.log('ssdhgfdhgfdfgdhfgdjgfdgshgfsbgsdhfvjkchgjhgjhdbjgbdjbkhgkhdg')
	var buyArray = [], sellArray = [];
	var pairVariable = req.query.pair;
	//var pairVariable = 'XLM_BTC';
	var WebSocket = require('ws');
	//res.status(200).send({sellPrice:3010,buyPrice:3108});

	var options = {
		method: 'GET',
		url: `https://api.exmo.com/v1/trades/?pair=${pairVariable}`,
		headers:
		{
			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
			'User-Agent': 'Mozilla/5.0'
		},
	};
	request(options, async function (error, respo, body) {
		try {
			var response = JSON.parse(respo.body);
			var pairVariableArray = response[pairVariable];

			pairVariableArray.forEach((pairVariableElement) => {
				//	console.log("ELEMENT", pairVariableElement)
				if (pairVariableElement.type === 'buy') {
					buyArray.push(pairVariableElement);
				} else if (pairVariableElement.type === 'sell') {
					sellArray.push(pairVariableElement);
				}
			})
			console.log("BUY ARRAY", buyArray.length);
			console.log("SELL ARRAY", sellArray.length);

			console.log('first pairArrayCurrencies', paginate(buyArray, 2, 2));
			console.log('second array', paginate(sellArray, 4, 1));

			res.send({ status: "true", ordersDataBuy: buyArray, ordersDataSell: sellArray });
		} catch (error) {

		}
	});

}





function paginate(array, page_size, page_number) {
	--page_number; // because pages logically start with 1, but technically with 0
	return array.slice(page_number * page_size, (page_number + 1) * page_size);
}





var chartData1 = async function (req, res) {
	//var pair = req.params.pair;
	var pair = 'BTC_USDT';
	var WebSocket = require('ws');
	var options = {
		method: 'GET',
		url: 'https://api.exmo.com/v1/order_book/?pair=' + pair,
		headers:
		{
			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
			'User-Agent': 'Mozilla/5.0'
		},
	};
	request(options, async function (error, respo, body) {
		try {
			var response = JSON.parse(respo.body);
			// console.log('response ', response.BTC_USDT.ask);
			// var pairArray = response[pair];
			// pairArray.forEach((pairVariableElement) => {
			//     if (pairVariableElement.type === 'ask') {
			//         ask.push(pairVariableElement);
			//     } else if (pairVariableElement.type === 'bid') {
			//         bid.push(pairVariableElement);
			//     }
			// })
			//  res.status(200).json(response);
		}
		catch (error) {
			console.log(error);
		}
	});
}





// var updatePriceCron = async function (req, res) {
// 	var WebSocket = require('ws');
// 	//res.status(200).send({sellPrice:3010,buyPrice:3108});
// 	var options = {
// 		method: 'POST',
// 		url: 'https://api.exmo.com/v1/ticker/',
// 		headers:
// 		{
// 			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
// 			'cache-control': 'no-cache',
// 			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
// 			'User-Agent': 'Mozilla/5.0'
// 		},
// 	};
// 	request(options, async function (error, respo, body) {
// 		try {
// 			var pairArray = [];
// 			var pairArrayObj = {};
// 			var availablePairArray = [];
// 			var arr1 = ['BTC', 'ETH', 'BCH', 'XLM', 'XMR', 'LTC', 'XRP', 'USDT'];
// 			var arr2 = ['BTC', 'ETH', 'BCH', 'XLM', 'XMR', 'LTC', 'XRP', 'USDT'];
// 			arr1.forEach((arr1Element) => {
// 				arr2.forEach((arr2Element) => {
// 					if (arr1Element !== arr2Element) {
// 						pairArray.push(arr1Element + "_" + arr2Element);
// 					}
// 				})
// 			})
// 			var response = JSON.parse(respo.body);
// 			pairArray.forEach((pairArrayElement) => {
// 				if (response[pairArrayElement]) {
// 					pairArrayObj[pairArrayElement] = response[pairArrayElement];
// 					availablePairArray.push(pairArrayElement);
// 					// availablePairArray[pairArrayElement] = pairArrayElement;
// 				}
// 			})
// 			// console.log('PAIR ARRAY OBJECT', availablePairArray);
// 			// console.log('pairArrayObj ', pairArrayObj);
// 			// console.log(pairArrayObj)
// 			res.send({ status: "true", pairArray: availablePairArray, pairArrayObjData: pairArrayObj });
// 		} catch (error) {
// 		}
// 	});
// }





let chartData = async function (req, res) {
	var pair = req.params.pair;
	var options = {
		method: 'GET',
		url: 'https://api.exmo.com/v1/order_book/?pair=' + pair,
		headers:
		{
			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
			'User-Agent': 'Mozilla/5.0'
		},
	};
	request(options, async function (error, respo, body) {
		try {
			var response = JSON.parse(respo.body);
			var ask = [];
			var bid = [];
			const i = 1;
			var pairAsk = response[pair].ask;
			var pairBid = response[pair].bid;
			function Comparator(a, b) {
				if (a[0] < b[0]) return -1;
				if (a[0] > b[0]) return 1;
				return 0;
			}
			let myArray = pairAsk.sort(Comparator);
			// myArray = pairBid.sort(Comparator)
			pairAsk.forEach((pairVariableElement) => {
				// console.log('pairVariableElement ', pairVariableElement);
				ask.push(pairVariableElement.slice(0, i).concat(pairVariableElement.slice(i + 1, pairVariableElement.length)).map(Number));
			});
			pairBid.forEach((pairVariableElement) => {
				// console.log('pairVariableElement ', pairVariableElement);
				bid.push(pairVariableElement.slice(0, i).concat(pairVariableElement.slice(i + 1, pairVariableElement.length)).map(Number));
			});
			res.status(200).json({ ask: ask, bid: bid });
		}
		catch (error) {
			console.log(error);
		}
	});
}




var orderData = async function (req, res) {
	var pair = req.params.pair;
	var WebSocket = require('ws');
	var options = {
		method: 'GET',
		url: 'https://api.exmo.com/v1/trades/?pair=' + pair + '&limit=20',
		headers:
		{
			'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
			'User-Agent': 'Mozilla/5.0'
		},
	};
	request(options, async function (error, respo, body) {
		try {
			var response = JSON.parse(respo.body);
			var buy = [];
			var sell = [];
			var trade = response[pair];
			trade.forEach((pairArrayElement) => {
				if (pairArrayElement.type === 'buy') {
					buy.push(pairArrayElement);
				} else {
					sell.push(pairArrayElement);
				}
			});
			res.status(200).json({ buy: buy, sell: sell });
		} catch (error) {
			console.log(error);
		}
	});
}

var orderDataWallebi = async function (req, res) {
	var pairData = req.params.pair;
	var pair = pairData.replace('_', '-');
	console.log(pair);
	try {
       // if (req.query.search == '' || req.query.search == 'undefined') {
            let { page, perpage } = req.query;
            let pgNo = Number(page);//|| 1;
            let recordPerPage = Number(perpage);// || 4;
            let skip = (pgNo - 1) * recordPerPage;
            let ordr = await LimitOrder.find({ orderType : "Limit", pair : pair, status: "pending" }).skip(skip).limit(recordPerPage).sort({ timestamp: -1 });
            let count = await LimitOrder.find({ orderType : "Limit", pair : pair, status: "pending" }).countDocuments();
            res.status(200).json({ orders: ordr, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
        // } else {
        //     var search = req.query.search;
        //     let { page, perpage } = req.query;
        //     let pgNo = Number(page);//|| 1;
        //     let recordPerPage = Number(perpage);// || 4;
        //     let skip = (pgNo - 1) * recordPerPage;
        //     let filter = { orderType : "Limit", pair : pair , $or: [{ receiverAddress: { $regex: search } }, { txId: { $regex: search } }, { currencyType: { $regex: search } }, { type: { $regex: search } }] };
        //     let ordr = await LimitOrder.find(filter).skip(skip).limit(recordPerPage).sort({ timestamp: -1 });
        //     let count = await LimitOrder.find({ userId: req.user.id }).countDocuments();
        //     res.status(200).json({ orders: ordr, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
        // }
    } catch (error) {
        // console.log(error)
        res.status(500).json({ status: false, message: 'Internal Server Error' });
        console.log(error);
    }




}


var sendDataExchange = async function (req, res) {
	try {
		let { id } = req.user;
		let { quantity, total, pair, bidPrice, typeofTransaction, serviceCharge, partialOrder } = req.body;
		let serviceCharges = String(serviceCharge);
		console.log('req.body',req.body);
		
		var receivedOrder = {
			userId: '',
			quantity: '',
			totalAmount: '',
			pair: '',
			price: '',
			exchangedCryptoCurrentPrice: '',
			typeOfTransaction: '',
			orderType: '',
			serviceCharge: '',
			partial: Boolean('')
		}
		var errorObj = {
			userId: '',
			quantity: '',
			totalAmount: '',
			pair: '',
			price: '',
			exchangedCryptoCurrentPrice: '',
			typeOfTransaction: '',
			orderType: '',
			serviceCharge: '',
			partial: '',
		}
		console.log('partialOrderdddddd',partialOrder);
		//return;
		if (typeof id !== 'undefined' && id && id !== '' &&
			typeof quantity !== 'undefined' && quantity && quantity !== '' &&
			typeof total !== 'undefined' && total && total !== '' &&
			typeof pair !== 'undefined' && pair && pair !== '' &&
			typeof bidPrice !== 'undefined' && bidPrice && bidPrice !== '' &&
			typeof typeofTransaction !== 'undefined' && typeofTransaction && typeofTransaction !== '' &&
			typeof serviceCharges !== 'undefined' && serviceCharges && serviceCharges !== '') {

			receivedOrder.userId = id;
			receivedOrder.quantity = quantity;
			receivedOrder.totalAmount = total.toFixed(5);
			receivedOrder.pair = pair;
			receivedOrder.price = bidPrice;
			receivedOrder.exchangedCryptoCurrentPrice = bidPrice;
			receivedOrder.typeOfTransaction = typeofTransaction;
			receivedOrder.serviceCharge = serviceCharges;
			receivedOrder.partial = partialOrder;
			receivedOrder.orderType = "Limit";

			var splitpair = pair.split("-");
			if (typeofTransaction == 'Buy') {
				var cryptoSymbol = splitpair[1];
				var cryptoAmt = total;
			} else {
				var cryptoSymbol = splitpair[0];
				var cryptoAmt = quantity;
			}
			console.log('partialOrderdddddd',receivedOrder);
			
			LimitOrder.create(receivedOrder, async function (error, txnSaved) {
				if (txnSaved && !error) {
					let addToUserTradeWalletCredit1 = new Trade({
						userId: id,
						cryptoAmount: -cryptoAmt,
						euroAmount: '',
						cryptoCurrentPrice: bidPrice,
						cryptoType: cryptoSymbol,
						txType: typeofTransaction,
						txId: txnSaved._id,
						type: 'debit',
						status: "completed",
						partial: partialOrder
					});
					await addToUserTradeWalletCredit1.save((err) => {
						if (err) {
							console.log(err);
						} else {
							console.log('record saved')
							//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
						}
					});
					await userCryptoTradeBalance(id, cryptoSymbol).then(async (userethereumBalance) => {
						console.log('userethereumBalance',userethereumBalance)
						if (userethereumBalance) {
							await TradeWallet.findOneAndUpdate({ userId: id, symbol: cryptoSymbol }, { balance: userethereumBalance }).then((result) => {
							console.log('tradebalance_result',result);
								// exceute scoket if want real time balance
							}).catch((error) => {
								res.status(200).json({ status: false, message: error, type: 'error in saving' })
							});
						}
					}).catch((error) => {
						res.status(200).json({ status: false, message: error, type: 'error in saving' })
					});
		
					ioSocketss.emit("limitorder", pair)
					
					//global.iosocket.emit("updatebalance",  'updatebalance')
					res.status(200).json({ status: true, message: "Request saved successfully" });
				} else {
					console.log(error);
				}
			});
			
		} else {
			errorObj.userId = 'userId is required';
			errorObj.quantity = 'Quantity is required';
			errorObj.totalAmount = 'Total amount is required';
			errorObj.pair = 'Pair is required';
			errorObj.price = 'Price is required';
			errorObj.exchangedCryptoCurrentPrice = 'Price is required';
			errorObj.typeOfTransaction = 'typeOfTransaction is required';
			res.status(200).json({ status: false, message: errorObj });
		}
	} catch (eroor) {
		res.status(500).json({status: false, message: eroor })
	}
}



var marketOrder = async function (req, res) {
	
	try {
		console.log('req.body',req.body)
		console.log('req.body',req.user.id)
		let { id } = req.user;
		let { quantity, total, pair, lastPrice, typeofTransaction, serviceCharge, partialOrder, firstCrypto } = req.body;
		var secondCrypto = req.body.secondCrypto.toUpperCase();

		var receivedOrder = {
			userId: '',
			quantity: '',
			totalAmount: '',
			pair: '',
			price: '',
			exchangedCryptoCurrentPrice: '',
			typeOfTransaction: '',
			serviceCharge: '',
			partial: Boolean(''),
			orderType : ''
		}
		var errorObj = {
			userId: '',
			quantity: '',
			totalAmount: '',
			pair: '',
			price: '',
			exchangedCryptoCurrentPrice: '',
			typeOfTransaction: '',
			serviceCharge: '',
			partial: '',
		}
		//console.log('receivedMARKETOrder ', partialOrder);
		if (typeof id !== 'undefined' && id && id !== '' &&
			typeof quantity !== 'undefined' && quantity && quantity !== '' &&
			typeof total !== 'undefined' && total && total !== '' &&
			typeof pair !== 'undefined' && pair && pair !== '' &&
			typeof lastPrice !== 'undefined' && lastPrice && lastPrice !== '' &&
			typeof typeofTransaction !== 'undefined' && typeofTransaction && typeofTransaction !== '' &&
			typeof serviceCharge !== 'undefined' && serviceCharge && serviceCharge != '') {

			receivedOrder.userId = id;
			receivedOrder.quantity = quantity;
			receivedOrder.totalAmount = total.toFixed(5);
			receivedOrder.pair = pair;
			receivedOrder.price = lastPrice;
			receivedOrder.exchangedCryptoCurrentPrice = lastPrice;
			receivedOrder.typeOfTransaction = typeofTransaction;
			receivedOrder.serviceCharge = serviceCharge;
			if(!partialOrder){
				receivedOrder.partial = false;
			} else {
				receivedOrder.partial = partialOrder;
			}
			
			receivedOrder.orderType = "Market";
			console.log('receivedOrder ', receivedOrder);

			LimitOrder.create(receivedOrder, async function (error, txnSaved) {
				
				var transactionID = uniqueString();
				if (txnSaved && !error) {
					let order = await LimitOrder.find({ status: 'pending', orderType: 'Limit' }).sort({ createdDate: -1 }).limit();
					//	console.log('morders', morder);
					//console.log('Lorders', order);
					var marketDataPair = txnSaved.pair;
					var marketDataPrice = txnSaved.price;
					var marketDataType = txnSaved.typeOfTransaction;
					var marketDataQuantity = txnSaved.quantity;
					var marketDataUserId = txnSaved.userId;
					var marketDataTotalAmount = txnSaved.totalAmount.toFixed(5);
					var marketDataId = txnSaved._id;
					var marketDatapartial = txnSaved.partial;
					if (order) {
						//	console.log('limit order', order);
						var newarr = order.filter(function (limitData) {
							// console.log('limitData.typeofTransaction',limitData.typeOfTransaction)
							// console.log('marketDataType',marketDataType)
							if (marketDataType == 'Buy') {
								{ return limitData.pair == marketDataPair && limitData.typeOfTransaction != marketDataType && limitData.price <= marketDataPrice && limitData.quantity == marketDataQuantity && limitData.userId != String(marketDataUserId) && limitData.status == "pending"}
							} else {
								{ return limitData.pair == marketDataPair && limitData.typeOfTransaction != marketDataType && limitData.price >= marketDataPrice && limitData.quantity == marketDataQuantity && limitData.userId != String(marketDataUserId) && limitData.status == "pending"}
							}
						}).map(function (limitData) {
							return limitData;
						}).sort(function (limitData) {
							return limitData.createdDate;
						}).reverse();
						console.log('Matched Orders', newarr);
					
						if (newarr.length > 0) {
							if (newarr[0].typeOfTransaction == 'Buy') {
								
								var amountdeductedLimit = marketDataTotalAmount;
								var amountCreditedLimit = newarr[0].quantity;
								var amountdeductedMarket = marketDataQuantity;
								var amountCreditedMarket = marketDataTotalAmount;
								var trxtypeMarket = 'Sell';
								var trxtypeLimit = 'Buy';
								var cryptoTypeforCreditMarket = secondCrypto;
								var cryptoTypeforDebitMarket = firstCrypto;
								var cryptoTypeforCreditLimit = firstCrypto;
								var cryptoTypeforDebitLimit = secondCrypto;
								var marketUserFees = Number(serviceCharge);
								var marketUserFeesCrypto = secondCrypto;
							} else {
								
								var amountdeductedLimit = newarr[0].quantity;
								var amountCreditedLimit = marketDataTotalAmount;
								var amountdeductedMarket = marketDataTotalAmount;
								var amountCreditedMarket = newarr[0].quantity;
								var trxtypeMarket = 'Buy';
								var trxtypeLimit = 'Sell';
								var cryptoTypeforCreditMarket = firstCrypto;
								var cryptoTypeforDebitMarket = secondCrypto;
								var cryptoTypeforCreditLimit = secondCrypto;
								var cryptoTypeforDebitLimit = firstCrypto;
								var marketUserFees = Number(serviceCharge);
								var marketUserFeesCrypto = firstCrypto;
							}
							let marketUserTradeWalletFeesDebit = new Trade({
								userId: marketDataUserId,
								cryptoAmount: -marketUserFees,
								euroAmount: 0,
								cryptoCurrentPrice: marketDataPrice,
								cryptoType: marketUserFeesCrypto,
								txType: "Fees",
								txId: transactionID,
								type: 'debit',
								status: "completed",
								txFee : marketUserFees
							});
							marketUserTradeWalletFeesDebit.save(async (err) => {
								if (err) {
									console.log(err);
								} else {
									console.log('record saved')
									await userCryptoTradeBalance(marketDataUserId, marketUserFeesCrypto).then(async (userethereumBalance) => {
										if (userethereumBalance) {
											await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: marketUserFeesCrypto }, { balance: userethereumBalance }).then((result) => {
												if (result) {
												}
											}).catch((error) => {
											});
										}
									}).catch((error) => {
									});
								}
							});
							let marketUserTradeWalletDebit = new Trade({
								userId: marketDataUserId,
								cryptoAmount: -amountdeductedMarket,
								euroAmount: newarr[0].quantity,
								cryptoCurrentPrice: marketDataPrice,
								cryptoType: cryptoTypeforDebitMarket,
								txType: trxtypeMarket,
								txId: transactionID,
								type: 'debit',
								status: "completed"
							});
							marketUserTradeWalletDebit.save(async (err) => {
								if (err) {
									console.log(err);
								} else {
									console.log('record saved')
									await userCryptoTradeBalance(marketDataUserId, cryptoTypeforDebitMarket).then(async (userethereumBalance) => {
										if (userethereumBalance) {
											await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: cryptoTypeforDebitMarket }, { balance: userethereumBalance }).then((result) => {
												// exceute scoket if want real time balance
												if (result) {
													//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
												}
											}).catch((error) => {
											//	res.status(200).json({ success: false, msg: error, type: 'error in saving' })
											});
										}
									}).catch((error) => {
										//res.status(200).json({ success: false, msg: error, type: 'error in saving' })
									});
									//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
								}
							});

							let marketUserTradeWalletCredit = new Trade({
								userId: marketDataUserId,
								cryptoAmount: amountCreditedMarket,
								euroAmount: newarr[0].totalAmount,
								cryptoCurrentPrice: marketDataPrice,
								cryptoType: cryptoTypeforCreditMarket,
								txType: trxtypeMarket,
								txId: transactionID,
								type: 'credit',
								status: "completed"
							});
							marketUserTradeWalletCredit.save(async (err) => {
								if (err) {
									console.log(err);
								} else {
									console.log('record saved')
									await userCryptoTradeBalance(marketDataUserId, cryptoTypeforCreditMarket).then(async (userethereumBalance) => {
										if (userethereumBalance) {
											await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: cryptoTypeforCreditMarket }, { balance: userethereumBalance }).then((result) => {
												// exceute scoket if want real time balance
												if (result) {
													//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
												}
											}).catch((error) => {
											//	res.status(200).json({ success: false, msg: error, type: 'error in saving' })
											});
										}
									}).catch((error) => {
										//res.status(200).json({ success: false, msg: error, type: 'error in saving' })
									});
									
									//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
								}
							});

							let limitUserTradeWalletCredit = new Trade({
								userId: newarr[0].userId,
								cryptoAmount: amountCreditedLimit,
								euroAmount: newarr[0].quantity,
								cryptoCurrentPrice: marketDataPrice,
								cryptoType: cryptoTypeforCreditLimit,
								txType: trxtypeLimit,
								txId: transactionID,
								type: 'credit',
								status: "completed"
							});
							limitUserTradeWalletCredit.save(async (err) => {
								if (err) {
									console.log(err);
								} else {
									console.log('record saved')
									await userCryptoTradeBalance(newarr[0].userId, cryptoTypeforCreditLimit).then(async (userethereumBalance) => {
										if (userethereumBalance) {
											await TradeWallet.findOneAndUpdate({ userId: newarr[0].userId, symbol: cryptoTypeforCreditLimit }, { balance: userethereumBalance }).then((result) => {
												// exceute scoket if want real time balance
												if (result) {
													//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
												}
											}).catch((error) => {
											//	res.status(200).json({ success: false, msg: error, type: 'error in saving' })
											});
										}
									}).catch((error) => {
										//res.status(200).json({ success: false, msg: error, type: 'error in saving' })
									});
									//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
								}
							});

							let limitUserTradeWalletDebit = new Trade({
								userId: newarr[0].userId,
								cryptoAmount: -amountdeductedLimit,
								euroAmount: newarr[0].totalAmount,
								cryptoCurrentPrice: marketDataPrice,
								cryptoType: cryptoTypeforDebitLimit,
								txType: trxtypeLimit,
								txId: transactionID,
								type: 'debit',
								status: "completed"
							});
							limitUserTradeWalletDebit.save(async (err) => {
								if (err) {
									console.log(err);
								} else {
									console.log('record saved')
									await userCryptoTradeBalance(newarr[0].userId, cryptoTypeforDebitLimit).then(async (userethereumBalance) => {
										if (userethereumBalance) {
											await TradeWallet.findOneAndUpdate({ userId: newarr[0].userId, symbol: cryptoTypeforDebitLimit }, { balance: userethereumBalance }).then((result) => {
												// exceute scoket if want real time balance
												if (result) {
													//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
												}
											}).catch((error) => {
											//	res.status(200).json({ success: false, msg: error, type: 'error in saving' })
											});
										}
									}).catch((error) => {
										//res.status(200).json({ success: false, msg: error, type: 'error in saving' })
									});
									//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
								}
							});
							LimitOrder.findByIdAndUpdate(newarr[0]._id, { status: 'completed' , transactionId: transactionID }, (err, result) => {
								if (err) {
									//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
								} else {
									// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
								}
							});
							LimitOrder.findByIdAndUpdate(marketDataId, { status: 'completed' , transactionId: transactionID }, (err, result) => {
								if (err) {
									//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
								} else {
									// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
								}
							});
							ioSocketss.emit("limitorder", pair)
							
							res.status(200).json({ status: true, message: "Records Found and updated !" });
						} else {
						
						if(marketDatapartial == true){
								var newarray = order.filter(function (limitDatapartial) {
								
									if (marketDataType == 'Buy') {
										{ return limitDatapartial.pair == marketDataPair && limitDatapartial.typeOfTransaction != marketDataType && limitDatapartial.price <= marketDataPrice && limitDatapartial.quantity > marketDataQuantity && limitDatapartial.userId != String(marketDataUserId) && limitDatapartial.partial == marketDatapartial && limitDatapartial.status == "pending"}
									} else {
										{ return limitDatapartial.pair == marketDataPair && limitDatapartial.typeOfTransaction != marketDataType && limitDatapartial.price >= marketDataPrice && limitDatapartial.quantity > marketDataQuantity && limitDatapartial.userId != String(marketDataUserId) && limitDatapartial.partial == marketDatapartial && limitDatapartial.status == "pending"}
									}
								}).map(function (limitDatapartial) {
									return limitDatapartial;
								}).sort(function (limitDatapartial) {
									return limitDatapartial.quantity;
								}).reverse();
								
								console.log('Matched Partial Orders', newarray);
								
								if (newarray.length > 0) {
								
									if (newarray[0].typeOfTransaction == 'Buy') {
									
										var trxtypeMarket = 'Sell';
										var trxtypeLimit = 'Buy';
										var amountdeductedLimit = marketDataTotalAmount;
										var amountCreditedLimit = newarray[0].quantity;
										var amountdeductedMarket = marketDataQuantity;
										var amountCreditedMarket = marketDataTotalAmount;
										var cryptoTypeforCreditMarket = secondCrypto;
										var cryptoTypeforDebitMarket = firstCrypto;
										var cryptoTypeforCreditLimit = firstCrypto;
										var cryptoTypeforDebitLimit = secondCrypto;
										var marketUserFees = Number(serviceCharge);
										var marketUserFeesCrypto = secondCrypto;
									} else {
									
										var trxtypeMarket = 'Buy';
										var trxtypeLimit = 'Sell';
										var amountdeductedLimit = newarray[0].quantity;
										var amountCreditedLimit = marketDataTotalAmount;
										var amountdeductedMarket = marketDataTotalAmount;
										var amountCreditedMarket = newarray[0].quantity;
										var cryptoTypeforCreditMarket = firstCrypto;
										var cryptoTypeforDebitMarket = secondCrypto;
										var cryptoTypeforCreditLimit = secondCrypto;
										var cryptoTypeforDebitLimit = firstCrypto;
										var marketUserFees = Number(serviceCharge);
										var marketUserFeesCrypto = firstCrypto;

									}
									let marketUserTradeWalletFeesDebit = new Trade({
										userId: marketDataUserId,
										cryptoAmount: -marketUserFees,
										euroAmount: 0,
										cryptoCurrentPrice: marketDataPrice,
										cryptoType: marketUserFeesCrypto,
										txType: "Fees",
										txId: transactionID,
										type: 'debit',
										status: "completed",
										txFee : marketUserFees
									});
									marketUserTradeWalletFeesDebit.save(async (err) => {
										if (err) {
											console.log(err);
										} else {
											console.log('record saved')
											await userCryptoTradeBalance(marketDataUserId, marketUserFeesCrypto).then(async (userethereumBalance) => {
												if (userethereumBalance) {
													await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: marketUserFeesCrypto }, { balance: userethereumBalance }).then((result) => {
														if (result) {
														}
													}).catch((error) => {
													});
												}
											}).catch((error) => {
											});
										}
									});

									let addToUserTradeWalletDebit = new Trade({
										userId: marketDataUserId,
										cryptoAmount: -amountdeductedMarket,
										euroAmount: newarray[0].quantity,
										cryptoCurrentPrice: marketDataPrice,
										cryptoType: cryptoTypeforDebitMarket,
										txType: trxtypeMarket,
										txId: transactionID,
										type: 'debit',
										status: "completed"
									});
									addToUserTradeWalletDebit.save(async (err) => {
										if (err) {
											console.log(err);
										} else {
											console.log('record saved')
											await userCryptoTradeBalance(marketDataUserId, cryptoTypeforDebitMarket).then(async (userethereumBalance) => {
												if (userethereumBalance) {
													await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: cryptoTypeforDebitMarket }, { balance: userethereumBalance }).then((result) => {
														// exceute scoket if want real time balance
														if (result) {
															//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
														}
													}).catch((error) => {
														res.status(200).json({ status: false, message: error, type: 'error in saving' })
													});
												}
											}).catch((error) => {
												res.status(200).json({ status: false, message: error, type: 'error in saving' })
											});
											//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
										}
									});
		
									let addToUserTradeWalletCredit = new Trade({
										userId: marketDataUserId,
										cryptoAmount: amountCreditedMarket,
										euroAmount: newarray[0].totalAmount,
										cryptoCurrentPrice: marketDataPrice,
										cryptoType: cryptoTypeforCreditMarket,
										txType: trxtypeMarket,
										txId: transactionID,
										type: 'credit',
										status: "completed"
									});
									addToUserTradeWalletCredit.save(async (err) => {
										if (err) {
											console.log(err);
										} else {
											console.log('record saved')
											await userCryptoTradeBalance(marketDataUserId, cryptoTypeforCreditMarket).then(async (userethereumBalance) => {
												if (userethereumBalance) {
													await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: cryptoTypeforCreditMarket }, { balance: userethereumBalance }).then((result) => {
														// exceute scoket if want real time balance
														if (result) {
															//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
														}
													}).catch((error) => {
														res.status(200).json({ status: false, message: error, type: 'error in saving' })
													});
												}
											}).catch((error) => {
												res.status(200).json({ status: false, message: error, type: 'error in saving' })
											});
											//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
										}
									});
		
									let addToUserTradeWalletCredit1 = new Trade({
										userId: newarray[0].userId,
										cryptoAmount: amountCreditedLimit,
										euroAmount: newarray[0].quantity,
										cryptoCurrentPrice: marketDataPrice,
										cryptoType: cryptoTypeforCreditLimit,
										txType: trxtypeLimit,
										txId: transactionID,
										type: 'credit',	
										status: "completed"
									});
									addToUserTradeWalletCredit1.save(async (err) => {
										if (err) {
											console.log(err);
										} else {
											console.log('record saved')
											await userCryptoTradeBalance(newarray[0].userId, cryptoTypeforCreditLimit).then(async (userethereumBalance) => {
												if (userethereumBalance) {
													await TradeWallet.findOneAndUpdate({ userId: newarray[0].userId, symbol: cryptoTypeforCreditLimit }, { balance: userethereumBalance }).then((result) => {
														// exceute scoket if want real time balance
														if (result) {
															//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
														}
													}).catch((error) => {
														res.status(200).json({ status: false, message: error, type: 'error in saving' })
													});
												}
											}).catch((error) => {
												res.status(200).json({ status: false, message: error, type: 'error in saving' })
											});
											//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
										}
									});
		
									let addToUserTradeWalletDebit1 = new Trade({
										userId: newarray[0].userId,
										cryptoAmount: -amountdeductedLimit,
										euroAmount: newarray[0].totalAmount,
										cryptoCurrentPrice: marketDataPrice,
										cryptoType: cryptoTypeforDebitLimit,
										txType: trxtypeLimit,
										txId: transactionID,
										type: 'debit',
										status: "completed"
									});
									addToUserTradeWalletDebit1.save(async (err) => {
										if (err) {
											console.log(err);
										} else {
											console.log('record saved')
											await userCryptoTradeBalance(newarray[0].userId, cryptoTypeforDebitLimit).then(async (userethereumBalance) => {
												if (userethereumBalance) {
													await TradeWallet.findOneAndUpdate({ userId: newarray[0].userId, symbol: cryptoTypeforDebitLimit }, { balance: userethereumBalance }).then((result) => {
														// exceute scoket if want real time balance
														if (result) {
															//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
														}
													}).catch((error) => {
														res.status(200).json({ status: false, message: error, type: 'error in saving' })
													});
												}
											}).catch((error) => {
												res.status(200).json({ status: false, message: error, type: 'error in saving' })
											});
											//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
										}
									});
									LimitOrder.findByIdAndUpdate(newarray[0]._id, { status: 'completed', quantity: marketDataQuantity, totalAmount : (marketDataQuantity*newarray[0].price) }, (err, result) => {
										if (result) {
											//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
										// } else {
											let addLimitOrder = new LimitOrder({
											userId : result.userId,
											quantity : newarray[0].quantity - marketDataQuantity,
											totalAmount : (newarray[0].quantity - marketDataQuantity)*result.price,
											pair : result.pair,
											price : result.price,
											typeOfTransaction : result.typeOfTransaction,
											commission : result.serviceCharge,
											partial : true,
											orderType : "Limit"
											});

											
											//console.log('receivedOrder ', addLimitOrder);

											addLimitOrder.save((err) => {
												if (err) {
													console.log(err);
												} else {
													console.log('Record saved partial')
													//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
												}
											});
											// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
										}
									});
									LimitOrder.findByIdAndUpdate(marketDataId, { status: 'completed', transactionId: transactionID }, (err, result) => {
										if (err) {
											//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
										} else {
											// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
										}
									});
									ioSocketss.emit("limitorder", pair);
									res.status(200).json({ status: true, message: 'Records Found and updated !!' });
								} else {
									var newarrMul = order.filter(function (limitDataMultiple) {
										if (marketDataType == 'Buy') {
											{ return limitDataMultiple.pair == marketDataPair && limitDataMultiple.typeOfTransaction != marketDataType && limitDataMultiple.price <= marketDataPrice  && limitDataMultiple.userId != String(marketDataUserId) && limitDataMultiple.status == "pending" && limitDataMultiple.partial == marketDatapartial}
										} else {
											{ return limitDataMultiple.pair == marketDataPair && limitDataMultiple.typeOfTransaction != marketDataType && limitDataMultiple.price >= marketDataPrice  && limitDataMultiple.userId != String(marketDataUserId) && limitDataMultiple.status == "pending" && limitDataMultiple.partial == marketDatapartial}
										}
									}).map(function (limitDataMultiple) {
										return limitDataMultiple;
									}).sort(function (limitDataMultiple) {
										return limitDataMultiple.createdDate;
									}).reverse();

									console.log('newarrMul',newarrMul);
									if (newarrMul.length > 0) {

									let addedQuantity = 0;
									let addedQuantity1 = 0;
									var arrOrd = [];
									var arrOrd1 = [];
									for (let i=0; i<newarrMul.length;i++){
										addedQuantity = addedQuantity + newarrMul[i].quantity;
										arrOrd.push(newarrMul[i])
									
									}
									console.log('addedQuantity',addedQuantity)
									console.log('arrOrd',arrOrd)
									if(addedQuantity >= Number(receivedOrder.quantity)) {

									for (let j=0; j<newarrMul.length;j++){
										addedQuantity1 = addedQuantity1 + newarrMul[j].quantity;
										arrOrd1.push(newarrMul[j])
										if(Number(receivedOrder.quantity) == addedQuantity1){
										break;
										} else {
										continue;
										}
									}
									console.log('addedQuantity1',addedQuantity1)
									console.log('fetchedorder',arrOrd1)
									if (arrOrd1.length > 0) {
										arrOrd1.forEach(matchedPartial => {
											console.log('matchedPartial',matchedPartial)
											if (matchedPartial.typeOfTransaction == 'Buy') {
												//	var transactionType = "debit";
												var trxtype = 'Sell';
												
												let addToUserTradeWalletDebit = new Trade({
													userId: marketDataUserId,
													cryptoAmount: -matchedPartial.quantity,
													euroAmount: matchedPartial.total,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: firstCrypto,
													txType: trxtype,
													txId: transactionID,
													type: 'debit',
													status: "completed"
												});
												addToUserTradeWalletDebit.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(marketDataUserId, firstCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletCredit = new Trade({
													userId: marketDataUserId,
													cryptoAmount: (matchedPartial.quantity*marketDataPrice),
													euroAmount: matchedPartial.totalAmount,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: secondCrypto,
													txType: trxtype,
													txId: transactionID,
													type: 'credit',
													status: "completed"
												});
												addToUserTradeWalletCredit.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(marketDataUserId, secondCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletCredit1 = new Trade({
													userId: matchedPartial.userId,
													cryptoAmount: (matchedPartial.quantity),
													euroAmount: matchedPartial.quantity,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: firstCrypto,
													txType: matchedPartial.typeOfTransaction,
													txId: transactionID,
													type: 'credit',
													status: "completed"
												});
												addToUserTradeWalletCredit1.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(matchedPartial.userId, firstCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: matchedPartial.userId, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletDebit1 = new Trade({
													userId: matchedPartial.userId,
													cryptoAmount: -(matchedPartial.totalAmount),
													euroAmount: matchedPartial.totalAmount,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: secondCrypto,
													txType: matchedPartial.typeOfTransaction,
													txId: transactionID,
													type: 'debit',
													status: "completed"
												});
												addToUserTradeWalletDebit1.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(matchedPartial.userId, secondCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: matchedPartial.userId, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
											} else {
												//	var transactionType = "credit";
												var trxtype = 'Buy';
												let addToUserTradeWalletDebit = new Trade({
													userId: marketDataUserId,
													cryptoAmount: -matchedPartial.quantity*marketDataPrice,
													euroAmount: matchedPartial.total,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: secondCrypto,
													txType: trxtype,
													txId: transactionID,
													type: 'debit',
													status: "completed"
												});
												addToUserTradeWalletDebit.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(marketDataUserId, secondCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletCredit = new Trade({
													userId: marketDataUserId,
													cryptoAmount: matchedPartial.quantity,
													euroAmount: matchedPartial.totalAmount,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: firstCrypto,
													txType: trxtype,
													txId: transactionID,
													type: 'credit',
													status: "completed"
												});
												addToUserTradeWalletCredit.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(marketDataUserId, firstCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: marketDataUserId, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletDebit1 = new Trade({
													userId: matchedPartial.userId,
													cryptoAmount: (matchedPartial.totalAmount),
													euroAmount: matchedPartial.quantity,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: secondCrypto,
													txType: matchedPartial.typeOfTransaction,
													txId: transactionID,
													type: 'credit',
													status: "completed"
												});
												addToUserTradeWalletDebit1.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(matchedPartial.userId, secondCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: matchedPartial.userId, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
					
												let addToUserTradeWalletCredit1 = new Trade({
													userId: matchedPartial.userId,
													cryptoAmount: -(matchedPartial.quantity),
													euroAmount: matchedPartial.totalAmount,
													cryptoCurrentPrice: marketDataPrice,
													cryptoType: firstCrypto,
													txType: matchedPartial.typeOfTransaction,
													txId: transactionID,
													type: 'debit',
													status: "completed"
												});
												addToUserTradeWalletCredit1.save(async (err) => {
													if (err) {
														console.log(err);
													} else {
														console.log('record saved')
														await userCryptoTradeBalance(matchedPartial.userId, firstCrypto).then(async (userethereumBalance) => {
															if (userethereumBalance) {
																await TradeWallet.findOneAndUpdate({ userId: matchedPartial.userId, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
																	// exceute scoket if want real time balance
																	if (result) {
																		//res.status(200).json({ success: true, msg: 'Trade balance updated', type: 'record saved' })
																	}
																}).catch((error) => {
																	res.status(200).json({ status: false, message: error, type: 'error in saving' })
																});
															}
														}).catch((error) => {
															res.status(200).json({ status: false, message: error, type: 'error in saving' })
														});
														//res.status(200).json({ success: true, msg: `${newarr.totalAmount} bitcoin added to your trade wallet` });
													}
												});
											}
										
											LimitOrder.findByIdAndUpdate(matchedPartial._id, { status: 'completed',transactionId: transactionID }, (err, result) => {
												if (err) {
													//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
												} else {
													// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
												}
											});
											
										});
										LimitOrder.findByIdAndUpdate(marketDataId, { status: 'completed',transactionId: transactionID }, (err, result) => {
											if (err) {
												//  res.status(200).json({ success: false, msg: err, type: 'errorC' });
											} else {
												// res.status(200).json({ success: true, msg: 'Bitcoin wallet activated successfully!', type: 'activate BTC' });
											}
										});
										ioSocketss.emit("limitorder", pair)
										res.status(200).json({ status : true , message: 'Records Found and updated !!!' });
									} 
									// else {
									// 	res.status(200).json({ status: 'No match found' });
									// }
								    } else {
									await fetchUserInfo('user_info', {}, (userInfo) => {
										let exmoBal;
										var balancesData = JSON.parse(userInfo).balances;
										for (var key in balancesData) {
											if (key == firstCrypto)
											exmoBal = balancesData[firstCrypto];
											
										  }
										//   console.log(' name=' + exmoBal );
										//console.log('user_infonames',names)
								if(marketDataType == 'Buy'){
								if(exmoBal < marketDataQuantity*marketDataPrice ){
									res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
								} else {
								sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
								// if(order){
								// 	res.status(200).json({ status: true, message: 'Request successfull.' });
								// }
								if (resultProvider.success === true) {
									res.status(200).json({ status: true, message: 'Request successfull.'  });
								}
								}).catch((error) => {
									res.status(200).json({ status: true, message: error });
								})
							   }
								} else {
									if(exmoBal< marketDataQuantity ){
										res.status(200).json({  status : false , message: 'Your order is canceled. We are short in liquidity.' });
									} else {
									sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
									// if(order){
									// 	res.status(200).json({ status: true, message: 'Request successfull.' });
									// }
									if (resultProvider.success === true) {
										res.status(200).json({ status: true, message: 'Request successfull.'  });
									}
									}).catch((error) => {
										res.status(200).json({ status: true, message: error });
									})
									}

								}
								});
								}
								//   else {
								// 	res.status(200).json({ status: 'No match found' });
								//   }

								} else {

									await fetchUserInfo('user_info', {}, (userInfo) => {
										let exmoBal;
										var balancesData = JSON.parse(userInfo).balances;
										for (var key in balancesData) {
											if (key == firstCrypto)
											exmoBal = balancesData[firstCrypto];
											
										  }
										//   console.log(' name=' + exmoBal );
										//console.log('user_infonames',names)
								if(marketDataType == 'Buy'){
								if(exmoBal < marketDataQuantity*marketDataPrice ){
									res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
								} else {
								sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
								// if(order){
								// 	res.status(200).json({ status: true, message: 'Request successfull.' });
								// }
								if (resultProvider.success === true) {
									res.status(200).json({ status: true, message: 'Request successfull.'  });
								}
								}).catch((error) => {
									res.status(200).json({ status: true, message: error });
								})
							   }
								} else {
									if(exmoBal< marketDataQuantity ){
										res.status(200).json({  status : false , message: 'Your order is canceled. We are short in liquidity.' });
									} else {
									sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
									// if(order){
									// 	res.status(200).json({ status: true, message: 'Request successfull.' });
									// }
									if (resultProvider.success === true) {
										res.status(200).json({ status: true, message: 'Request successfull.'  });
									}
									}).catch((error) => {
										res.status(200).json({ status: true, message: error });
									})
							 }

								}
								});
									//res.status(200).json({ status: 'No match found' });
								}
							
							    }
							
						} else {
							await fetchUserInfo('user_info', {}, (userInfo) => {
								let exmoBal;
								var balancesData = JSON.parse(userInfo).balances;
								for (var key in balancesData) {
									if (key == firstCrypto)
									exmoBal = balancesData[firstCrypto];
									
									}
									// console.log(' name=' + exmoBal );
								//console.log('user_infonames',names)
							if(marketDataType == 'Buy'){
							if(exmoBal < marketDataQuantity*marketDataPrice ){
								res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
							} else {
							sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
							// if(order){
							// 	res.status(200).json({ status: true, message: 'Request successfull.' });
							// }
							if (resultProvider.success === true) {
								res.status(200).json({ status: true, message: 'Request successfull.'  });
							}
							}).catch((error) => {
								res.status(200).json({ status: true, message: error });
							})
							}
							} else {
								if(exmoBal< marketDataQuantity ){
									res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
								} else {
								sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider:any) => {
								// if(order){
								// 	res.status(200).json({ status: true, message: 'Request successfull.' });
								// }
								if (resultProvider.success === true) {
									res.status(200).json({ status: true, message: 'Request successfull.'  });
								}
								}).catch((error) => {
									res.status(200).json({ status: true, message: error });
								})
								 }
		
							}
							});
						}
					    }
						//res.status(200).json(order);
					} else {
						
					await fetchUserInfo('user_info', {}, (userInfo) => {
						let exmoBal;
						var balancesData = JSON.parse(userInfo).balances;
						for (var key in balancesData) {
							if (key == firstCrypto)
							exmoBal = balancesData[firstCrypto];
							
							}
							// console.log(' name=' + exmoBal );
						//console.log('user_infonames',names)
					if(marketDataType == 'Buy'){
					if(exmoBal < marketDataQuantity*marketDataPrice ){
						res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
					} else {
					sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider: any) => {
					// if(order){
					// 	res.status(200).json({ status: true, message: 'Request successfull.' });
					// }
					if (resultProvider.success === true) {
						res.status(200).json({ status: true, message: 'Request successfull.'  });
					}

					}).catch((error) => {
						res.status(200).json({ status: true, message: error });
					})
				    }
					} else {
						if(exmoBal< marketDataQuantity ){
							res.status(200).json({ status : false , message: 'Your order is canceled. We are short in liquidity.' });
						} else {
						sendOrderToEmxmoForExchange(id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto).then((resultProvider: any) => {
						// if(order){

						// 	res.status(200).json({ status: true, message: 'Request successfull.' });
						// }
						if (resultProvider.success === true) {
							res.status(200).json({ status: true, message: 'Request successfull.'  });
						}
						}).catch((error) => {
							res.status(200).json({ status: false, message: error });
						})
				 		}

					}
					});

						//res.status(200).json(marketordersObj);
						
					}
					ioSocketss.emit("limitorder", pair);
					//res.status(200).json({ status: "Records Found and updated !" });
				} else {
					console.log(error);
				}
			});
		} else {
			errorObj.userId = 'userId is required';
			errorObj.quantity = 'Quantity is required';
			errorObj.totalAmount = 'Total amount is required';
			errorObj.pair = 'Pair is required';
			errorObj.price = 'Price is required';
			errorObj.exchangedCryptoCurrentPrice = 'Price is required';
			errorObj.typeOfTransaction = 'typeOfTransaction is required';
			res.status(200).json({ status : false , message: errorObj });
		}
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: error })
	}
}






var receiveOrdersList = async (req, res, next) => {
	try {
		var pair = req.params.newpair;
		if (pair == '' || pair == 'undefined') {
			let { page, perpage } = pair;
			let pgNo = Number(page);//|| 1;
			let recordPerPage = Number(perpage);// || 4;
			let skip = (pgNo - 1) * recordPerPage;
			// let trx = await orderSaveSchema.find({ userId: req._id }).skip(skip).limit(recordPerPage).sort({ createdDate: -1 });
			// let count = await orderSaveSchema.find({ userId: req._id }).count();
			// res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
		} else {
			let { page, perpage } = pair;
			let pgNo = Number(page);//|| 1;
			let recordPerPage = Number(perpage);// || 4;
			let skip = (pgNo - 1) * recordPerPage;
			// let filter = { userId: req.user.id, $or: [{ receiverAddress: { $regex: pair } }, { txId: { $regex: pair } }, { currencyType: { $regex: pair } }, { type: { $regex: pair } }] };
			LimitOrder.find().sort({ createdDate: -1 }).exec(function (txerr, txdoc) {
				LimitOrder.find().count().exec(function (txerr, count) {
					if (txerr) {
						res.status(500).json({ status: !1, message: "Internal Server Error" });
					}
					else {
						var returnJson = { status: !0, transactions: txdoc, current: pgNo, pages: Math.ceil(count / recordPerPage) };
						res.status(200).json(returnJson);
					}
				});
			});
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ status: false, message: 'Internal Server Error' });
	}
}

var dataaggregate = async () => {

	//var agggre = await Trade.find()

	// var agggre = await Trade.find().forEach(
	// 	function (newBook) {
	// 	//	newBook.category = db.categories.findOne( { "_id": newBook.category } );
	// 		//newBook.lendings = db.lendings.find( { "book": newBook._id  } ).toArray();
	// 		newBook.authors = LimitOrder.find( { "_id": { $in: newBook.txid }  } ).toArray();
	// 		//db.booksReloaded.insert(newBook);
	// 	}
	// );
	//Trade.find(LimitOrder.find({_id:txId}).toArray())

	// var agggre = await Trade.aggregate( [
	// 	{ $match : { txId : "$LimitOrder"} },
	// 	  { $out : "LimitOrder" }
	//   ] )
	// db.test.aggregate([{$lookup:{from:"test1",localField:"user_id",foreignField:"emp_id",as:"data"}}]).pretty();
	const agggre = await Trade.aggregate([{ $lookup: { from: "limitorders", localField: "txId", foreignField: "_id", as: "data" } }]);

	// Trade.aggregate([ { $match: { date: "20120105" } }, { $out: "subset" } ]);
	// var agggre = await LimitOrder.find(function (newBook) {
	// 	//	newBook.category = db.categories.findOne( { "_id": newBook.category } );
	// 		//newBook.lendings = db.lendings.find( { "book": newBook._id  } ).toArray();
	// 		newBook._id = Trade.find( { "txid": { $in: newBook._id }  } ).toArray();
	// 		//db.booksReloaded.insert(newBook);
	// 	})

	console.log('agggre', agggre);
}
//dataaggregate();

var receiveLimitOrdersList = async (req, res, next) => {
	let { id } = req.user;
	//console.log('I am in received')
	try {
		//	var pair = req.params.newpair;
		//	if (pair == '' || pair == 'undefined') {
		// let { page, perpage } = pair;
		// let pgNo = Number(page);//|| 1;
		// let recordPerPage = Number(perpage);// || 4;
		// let skip = (pgNo - 1) * recordPerPage;
		// let trx = await orderSaveSchema.find({ userId: req._id }).skip(skip).limit(recordPerPage).sort({ createdDate: -1 });
		// let count = await orderSaveSchema.find({ userId: req._id }).count();
		// res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
		//} else {
		// let { page, perpage } = pair;
		// let pgNo = Number(page);//|| 1;
		// let recordPerPage = Number(perpage);// || 4;
		// let skip = (pgNo - 1) * recordPerPage;
		// let filter = { userId: req.user.id, $or: [{ receiverAddress: { $regex: pair } }, { txId: { $regex: pair } }, { currencyType: { $regex: pair } }, { type: { $regex: pair } }] };
		LimitOrder.find({ status: 'pending', orderType: 'Limit', userId: id }).sort({ createdDate: -1 }).exec(function (txerr, txdoc) {
			//	LimitOrder.find().count().exec(function (txerr, count) {
			if (txerr) {
				res.status(200).json({ status: !1, message: "Internal Server Error" });
			} else {
				var returnJson = { status: !0, transactions: txdoc };
				res.status(200).json(returnJson);
			}
			//});
		});
		//}
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ status: false, message: 'Internal Server Error' });
	}
}

var receiveLimitOrdersListCompleted = async (req, res, next) => {
	let { id } = req.user;
	//console.log('I am in received')
	try {
		//	var pair = req.params.newpair;
		//	if (pair == '' || pair == 'undefined') {
		// let { page, perpage } = pair;
		// let pgNo = Number(page);//|| 1;
		// let recordPerPage = Number(perpage);// || 4;
		// let skip = (pgNo - 1) * recordPerPage;
		// let trx = await orderSaveSchema.find({ userId: req._id }).skip(skip).limit(recordPerPage).sort({ createdDate: -1 });
		// let count = await orderSaveSchema.find({ userId: req._id }).count();
		// res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
		//} else {
		// let { page, perpage } = pair;
		// let pgNo = Number(page);//|| 1;
		// let recordPerPage = Number(perpage);// || 4;
		// let skip = (pgNo - 1) * recordPerPage;
		// let filter = { userId: req.user.id, $or: [{ receiverAddress: { $regex: pair } }, { txId: { $regex: pair } }, { currencyType: { $regex: pair } }, { type: { $regex: pair } }] };
// LimitOrder.find({ status: 'completed' , userId: id , transactionId: {$ne:null} }).sort({ createdDate: -1 }).exec(function (txerr, txdoc) {
	//	LimitOrder.find().count().exec(function (txerr, count) {
LimitOrder.find({ status: 'completed' , userId: id }).sort({ createdDate: -1 }).exec(function (txerr, txdoc) {

	if (txerr) {
		res.status(200).json({ status: !1, message: "Internal Server Error" });
	} else {
		var returnJson = { status: !0, transactions: txdoc };
		res.status(200).json(returnJson);
	}
	//});
});
// LimitOrder.aggregate( // 1. Use any collection containing at least one document.
// 	[
	
// 	// 4. Lookup collections to union together.
// 	{ $lookup: { from: 'limitorders', pipeline: [{ $match: { status: 'completed' } }], as: 'limitorder' } },
// 	{ $lookup: { from: 'marketorders', pipeline: [{ $match: { status: 'Settle' } }], as: 'marketorder' } },

// 	// 5. Union the collections together with a projection.
// 	{ $project: { union: { $setUnion: ["$limitorder", "$marketorder"] } } },

// 	// 6. Unwind and replace root so you end up with a result set.
// 	{ $unwind: '$union' },
// 	  {$sort: {"union.createdDate": -1}},
// 	 // {$group: {_id: "$_id"}},
// 	// { $replaceRoot: { newRoot: '$union' } }
// 	]).sort({ createdDate: -1 }).limit(1000).exec(function (txerr, txdoc) {
// 		if (txerr) {
// 			res.status(200).json({ status: !1, message: "Internal Server Error" });
// 		} else {
// 			var returnJson = { status: !0, transactions: txdoc };
// 			res.status(200).json(returnJson);
// 		}
// 		//console.log('aggregates',txdoc)
// 	})

	
		//}
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ status: false, message: 'Internal Server Error' });
	}
}


//this.receiveLimitOrdersListCompleted();

let getmarketOrder = async (req, res, next) => {
	try {
		let order = await MarketOrder.find().sort({ createdDate: -1 }).limit(1);
		if (order) {
			console.log('order', order);
			res.status(200).json(order);
		} else {
			//res.status(200).json(marketordersObj);
			res.status(200).json("No data found");
		}
	} catch (e) {
		console.log(e.message);
	}
}

let getSettledMarketOrder = async (req, res, next) => {
	try {
		let morder = await MarketOrder.find().sort({ createdDate: -1 }).limit(1);
		let order = await LimitOrder.find({ status: 'pending' }).sort({ createdDate: -1 }).limit();
		console.log('morders', morder);
		console.log('Lorders', order);
		var marketDataPair = morder[0].pair;
		var marketDataPrice = morder[0].price;
		var marketDataType = morder[0].typeofTransaction;
		var marketDataQuantity = morder[0].quantity;

		if (order) {
			//	console.log('limit order', order);
			var newarr = order.filter(function (limitData) {
				if (marketDataType == 'Buy') {
					{ return limitData.pair == marketDataPair && limitData.typeOfTransaction != marketDataType && limitData.price == marketDataPrice && limitData.quantity == marketDataQuantity }
				} else {
					{ return limitData.pair == marketDataPair && limitData.typeOfTransaction != marketDataType && limitData.price == marketDataPrice && limitData.quantity == marketDataQuantity }
				}
			}).map(function (limitData) {
				return limitData;
			}).sort(function (limitData) {
				return limitData.createdDate;
			}).reverse();
			//console.log('Matched Orders', newarr);

			//res.status(200).json(order);
		} else {
			//res.status(200).json(marketordersObj);
			res.status(200).json({ status: false, message: 'No data found' });
		}
	} catch (e) {
		console.log(e.message);
	}
}

// let getSettledMarketOrderS = async (req, res, next) => {
//     try {
//         let morder = await MarketOrder.find().sort({ createdDate: -1 }).limit(1);
//         let order = await LimitOrder.find().sort({ createdDate: -1 }).limit();
// 		console.log('morders', morder);
// 		console.log('lorders', order);
//         var toBeSettledPair = morder[0].pair;
//         var toBeSettledPrice = morder[0].price;
//         var toBeSettledType = morder[0].typeofTransaction;
//         var amountOfCrypto = morder[0].quantity;
//       //  var searchSettleType;
//         // if (toBeSettledType = 'Buy') {
//         //     searchSettleType = 'Sell';
//         // } else {
//         //     searchSettleType = 'Buy';
//         // }
//         if (order) {
//         //    console.log('limit order', order);
//             var newarr = order.filter(function (newdata) {
// 			//	console.log('limit order_newdata', newdata);
//                 if (toBeSettledType == 'Buy') {
//                     { return newdata.pair == toBeSettledPair && newdata.typeOfTransaction != toBeSettledType && newdata.price == toBeSettledPrice && newdata.quantity == amountOfCrypto }
//                 } else {
//                     { return newdata.pair == toBeSettledPair && newdata.typeOfTransaction != toBeSettledType && newdata.price == toBeSettledPrice && newdata.quantity == amountOfCrypto }
//                 }
//             }).map(function (newdata) {
//                 return newdata;
//             }).sort(function (newdata) {
//                 return newdata.createdDate;
//             }).reverse();
//             console.log('Matched Orders', newarr);

//             //res.status(200).json(order);
//         } else {
//             //res.status(200).json(marketordersObj);
//             res.status(200).json({status: false, message: 'No data found' });
//         }
//     } catch (e) {
//         console.log(e.message);
//     }
// }





// let withdrawalBitcoinFromTrade = async (req, res, next) => {

//     let adminBtcAccount = AdminDetailsForTrade.btc.name;
//     let { coinType, withdrawAmount, withdrawBtcInEuro, bitcoinCurrentPrice, btcTransactionFee, verifyCode } = req.body;
//     let { id } = req.user;
//     let amoutToTransferWithFee = parseFloat(withdrawAmount) + parseFloat(btcTransactionFee);
//     let user = await User.findById(id);
//     if (user !== undefined && user !== null && user !== '') {
//         if (user.smscode === verifyCode) {
//             let btcTradeResult = await Trade.find({ userId: req.user.id, cryptoType: 'BTC', status: 'completed' });
//             if (btcTradeResult !== null && btcTradeResult !== undefined && btcTradeResult !== '') {
//                 let totalAmount = 0;
//                 btcTradeResult.forEach((value) => {
//                     totalAmount = totalAmount + value['cryptoAmount'];
//                 });
//                 if (amoutToTransferWithFee > 2) {
//                     res.status(200).json({ success: false, msg: "Insufficient Balance !", langid: "btcfail" });
//                 } else {
//                     let wallets = await Wallets.findOne({ userId: req.user.id });
//                     if (wallets) {
//                         let btcBalance = await getBTCBalance(adminBtcAccount);
//                         if (btcBalance) {
//                             if (amoutToTransferWithFee > btcBalance) {
//                                 res.status(200).json({ success: false, msg: "Insufficient Balance", langid: "btcfail" });
//                             } else {
//                                 // add balance to User trade wallet start		
//                                 let deductFromUserTradeWallet = new Trade({
//                                     userId: req.user.id,
//                                     cryptoAmount: -amoutToTransferWithFee,
//                                     euroAmount: withdrawBtcInEuro,
//                                     cryptoCurrentPrice: bitcoinCurrentPrice,
//                                     cryptoType: 'BTC',
//                                     txType: 'privateWallet',
//                                     withdrawalAmount: parseFloat(withdrawAmount).toFixed(8),
//                                     withdrawalFee: parseFloat(btcTransactionFee).toFixed(8),
//                                     withdrawalStatus: "pending",
//                                     type: 'debit',
//                                     status: "completed"
//                                 });
//                                 deductFromUserTradeWallet.save((err) => {
//                                     if (err) {
//                                         res.status(200).json({ success: false, msg: err, type: 'error in saving ' });
//                                     } else {
//                                         res.status(200).json({ success: true, msg: "Withdrawal Request Generated", type: "withdrawalsuccess" });
//                                     }
//                                 });
//                             }
//                         }
//                     }
//                 }
//             }
//         } else {
//             res.status(200).json({ success: false, msg: 'Your code in invalid!', type: 'code invalid' });
//         }
//     }
// }

/* This is the function to get the amount to be withdrawn into users trade wallet */

let withdrawalBitcoinFromExchangeTrade = async (req, res, next) => {
	try {
		let { coinType, bitcoin, btcWithFee } = req.body;
		let { id } = req.user;
		console.log(req.body, id)
		let amoutToTransfer = parseFloat(bitcoin);
		let user = await UserProfile.findOne({ userId: id });
		if (user !== undefined && user !== null && user !== '') {
			//if (user.smscode === verifyCode) {
			let btcExchangeTradeResult = await ExchangeTrade.find({ userId: req.user.id, cryptoType: 'BTC' });
			if (btcExchangeTradeResult !== null && btcExchangeTradeResult !== undefined && btcExchangeTradeResult !== '') {
				let totalAmount = 0;
				btcExchangeTradeResult.forEach((value) => {
					totalAmount = totalAmount + value['cryptoAmount'];
				});
				if (amoutToTransfer > totalAmount) {
					res.status(200).json({ success: false, msg: "Insufficient Balance !", langid: "btcfail" });
				} else {
					let wallets = await Wallets.findOne({ userId: req.user.id });
					const btcBalance = await getBTCBalance(wallets.bitcoin.name);
					if (wallets) {
						if (btcBalance) {
							if (amoutToTransfer > btcBalance) {
								res.status(200).json({ success: false, msg: "Insufficient Balance", langid: "btcfail" });
							} else {
								// add balance to User trade wallet start		
								let deductFromUserTradeWallet = new ExchangeTrade({
									userId: req.user.id,
									cryptoAmount: -amoutToTransfer,
									euroAmount: '',
									cryptoCurrentPrice: '',
									cryptoType: 'BTC',
									txType: 'privateWallet',
									withdrawalAmount: parseFloat(bitcoin).toFixed(8),
									withdrawalFee: parseFloat(btcWithFee).toFixed(8),
									withdrawalStatus: "completed",
									type: 'debit',
									status: "completed"
								});
								deductFromUserTradeWallet.save((err) => {
									if (err) {
										res.status(200).json({ success: false, msg: err, type: 'error in saving ' });
									} else {
										res.status(200).json({ success: true, msg: "Withdrawal Request Generated", type: "withdrawalsuccess" });
									}
								});
							}
						}
					}
				}
			}
			// } else {
			// 	res.status(200).json({ success: false, msg: 'Your code in invalid!', type: 'code invalid' });
			// }
		}
	} catch (error) {
		console.log(error);
	}
}

/**
 * topup bitcoin from user personal account to user trade account
 */
let transferBitcoinForExchangeTrade = async (req, res, next) => {
	try {
		console.log(req.body);
		let { bitcoin, btcWithFee } = req.body;
		let wallets = await Wallets.findOne({ userId: req.user.id });
		if (wallets !== null && wallets !== undefined && wallets !== '') {
			if (wallets.bitcoin !== null && wallets.bitcoin !== undefined && wallets.bitcoin !== '') {
				if (wallets.bitcoin.name !== null && wallets.bitcoin.name !== undefined && wallets.bitcoin.name !== '') {
					const btcBalance = await getBTCBalance(wallets.bitcoin.name);

					let btcTradeBalance = await getBTCTradeBalance(req.user.id);

					var btcTNewBalance = btcBalance - Number(btcTradeBalance);
					if (btcTNewBalance == 0) {
						res.status(200).json({ success: false, msg: 'Insufficient funds in personal wallet.', type: 'balance is not sufficent' })
					}
					//console.log('btcTNewBalance',btcTNewBalance);
					if (btcTNewBalance !== null && btcTNewBalance !== undefined && btcTNewBalance > 0) {
						if (btcTNewBalance <= 0) {
							res.status(200).json({ success: false, msg: "Your balance is insufficent!", type: 'balance is not sufficent' });
						} else {
							let addFundsToExchangeTrade = new ExchangeTrade({
								userId: req.user.id,
								cryptoAmount: bitcoin,
								cryptoType: 'BTC',
								txType: 'depositToTradeWallet',
								type: 'credit',
								status: "completed"
							});
							addFundsToExchangeTrade.save((err) => {
								if (err) {
									res.status(200).json({ success: false, msg: err, type: 'error in saving' })
								} else {
									res.status(200).json({ success: true, msg: "Amount transferred" });
								}
							});
						}
					} else {
						console.log('btc balance is null/undefined/empty');
					}
				} else {
					console.log('wallet name not exists!');
				}
			} else {
				console.log('BTC wallets not exits!');
			}
		} else {
			console.log('wallet not exists!');
		}
	} catch (error) {
		console.log(error);
	}
};

const updateB2bxPrice = async () => {

	var options = {
		method: 'POST',
		url: 'https://api.b2bx.exchange/api/v1/b2trade/auth',
		
		headers: { 'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a', 'cache-control': 'no-cache', 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW', 'User-Agent': 'Mozilla/5.0' },
		formData: { email: 'liquidity@wallebi.asia', password: 'Persian_2021' }
	};

	request(options, function (error, response, body) {
		if (error) { console.log("bbx error found"); }
	//	console.log(response);
		//return;
		let resp = JSON.parse(body);
		
		// return;
		let data = resp.data;

		if (data.user_id && data.session_token && data.token) {

			let sessionToken = data.session_token;
			let authToken = data.token;

			let wss = new WebSocket('wss://wss.b2bx.exchange/WSGateway/?session_token=' + sessionToken, {
				rejectUnauthorized: false, // Just for test. Allows connection to self-signed SSL.
				headers: {
					'user-agent': '',
				}
			});
			/**
				 *  send the reqquset for arder and strument
			   */
			wss.on('open', (e) => {

				wss.send(JSON.stringify({
					"m": 0,
					"i": 0,
					"n": 'WebAuthenticateUser',
					"o": '{"SessionToken":"' + authToken + '"}'
				}));
				/**
										* {"OMSId":1,"InstrumentId":84,"Symbol":"ETHEUR","Product1":5,"Product1Symbol":"ETH","Product2":15,"Product2Symbol":"EUR","InstrumentType" }
										* {"OMSId":1,"InstrumentId":86,"Symbol":"BTCEUR","Product1":1,"Product1Symbol":"BTC","Product2":15,"Product2Symbol":"EUR","InstrumentType"}
										* {"OMSId":1,"InstrumentId":85,"Symbol":"LTCEUR","Product1":2,"Product1Symbol":"LTC","Product2":15,"Product2Symbol":"EUR","InstrumentType" }
										* 
										*/
				[4 /*'ETHBTC'*/, 1 /*'BCHBTC'*/, 19 /*'XRPBTC'*/, 76 /*'XLMBTC'*/, 7 /*'XMRBTC'*/, 6 /*'LTCBTC'*/, 11 /*'BTCUSDT'*/, 12 /*'ETHUSDT'*/, 20 /*'XRPUSDT'*/, 13 /*'LTCUSDT'*/, 8 /*'BCHUSDT'*/, 10 /*'XMRUSDT'*/, 58 /*'XLMUSDT'*/].forEach(element => {
					//	['XLMUSDT'].forEach(element => {
					wss.send(JSON.stringify({
						"m": 0,
						"i": 0,
						"n": 'SubscribeLevel1',
						"o": '{"OMSId": 1, "InstrumentId":  ' + element + '}'
					}));
				});
			});

			/**
			*  get response from b2bx 
			*/
			wss.on('message', (data, flags) => {
				//console.log("message response found");
				//console.log(getRespData);

				var getRespData = JSON.parse(JSON.parse(data).o);
				console.log(getRespData);
			//	return ;
				if (getRespData) {
					//  console.log(getRespData);
					//return;
					let query, query1, CurrentBuyPrise, CurrentSellPrise;
					// if (getRespData.InstrumentId == 86) {
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxbtcBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxbtcSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});
					// }
					// else if (getRespData.InstrumentId == 85) {
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxltcBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxltcSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});
					// }
					// else if (getRespData.InstrumentId == 84) {
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxethBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});
					// 	SettingSchema.findOneAndUpdate({ colName: "b2bxethSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinData) {
					// 		if (err) { console.log(err); }
					// 		else { console.log(coinData); }
					// 	});

					// }
					if (getRespData.InstrumentId == 4) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxETHBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataBTCETH) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataBTCETH); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxETHBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataBTCETH) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataBTCETH); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 1) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxBCHBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataBCHBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataBCHBTC); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxBCHBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataBCHBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataBCHBTC); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 19) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXRPBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXRPBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXRPBTC); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXRPBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXRPBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXRPBTC); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 76) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXLMBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXLMBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXLMBTC); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXLMBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXLMBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXLMBTC); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 7) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXMRBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXMRBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXMRBTC); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXMRBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXMRBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXMRBTC); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 6) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxLTCBTCBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataLTCBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataLTCBTC); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxLTCBTCSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataLTCBTC) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataLTCBTC); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 11) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxBTCUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataBTCUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataBTCUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxBTCUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataBTCUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataBTCUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 12) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxETHUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataETHUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataETHUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxETHUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataETHUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataETHUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 20) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXRPUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXRPUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXRPUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXRPUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXRPUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXRPUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 13) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxLTCUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataLTCUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataLTCUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxLTCUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataLTCUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataLTCUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 8) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxBCHUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataBCHUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataBCHUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxBCHUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataBCHUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataBCHUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 10) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXMRUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXMRUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXMRUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXMRUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXMRUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXMRUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}
					else if (getRespData.InstrumentId == 58) {
						SettingSchema.findOneAndUpdate({ colName: "b2bxXLMUSDTBuyPrice" }, { colValue: getRespData.SessionLow }, { upsert: true }, function (err, coinBuyDataXLMUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinBuyDataXLMUSDT); }
						});
						SettingSchema.findOneAndUpdate({ colName: "b2bxXLMUSDTSellPrice" }, { colValue: getRespData.SessionHigh }, { upsert: true }, function (err, coinSellDataXLMUSDT) {
							if (err) { console.log(err); }
							else { console.log('Record updated', coinSellDataXLMUSDT); }
						});
						//  console.log(query,CurrentBuyPrise, query1,CurrentSellPrise);
					}



				}
			})

			wss.on('error', (e) => {
				console.log("bbx wss error found");
				console.log(e);
			});
		}

		else {
			//	console.log("request response failed Trade Id===>" + genTradeId);

		}
	});

}

//updateB2bxPrice();

const checkPairsB2bx = async () => {

	var options = {
		method: 'POST',
		url: 'https://api.b2bx.exchange/api/v1/b2trade/auth',
		headers: { 'postman-token': '54b1924b-885a-7441-d4f6-fbf222dc845a', 'cache-control': 'no-cache', 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW', 'User-Agent': 'Mozilla/5.0' },
		formData: { email: 'liquidity@wallebi.asia', password: 'Persian_2021' }
	};

	request(options, function (error, response, body) {
		if (error) { console.log("bbx error found",error); }
		console.log('body',body);
		let resp = JSON.parse(body);
		// console.log(resp);
		let data = resp.data;

		if (data.user_id && data.session_token && data.token) {

			let sessionToken = data.session_token;
			let authToken = data.token;

			let wss = new WebSocket('wss://wss.b2bx.exchange/WSGateway/?session_token=' + sessionToken, {
				rejectUnauthorized: false, // Just for test. Allows connection to self-signed SSL.
				headers: {
					'user-agent': '',
				}
			});
			/**
				 *  send the reqquset for arder and strument
			*/
			wss.on('open', (e) => {

				wss.send(JSON.stringify({
					"m": 0,
					"i": 0,
					"n": 'WebAuthenticateUser',
					"o": '{"SessionToken":"' + authToken + '"}'
				}));

				wss.send(JSON.stringify({
					"m": 0,
					"i": 0,
					"n": 'GetInstruments',
					"o": '{"OMSId":1}'
				}));
			});

			/**
			*  get response from b2bx 
			*/
			wss.on('message', (data, flags) => {
				//console.log("message response found");
				// console.log("getRespData", data);
				var getRespData = JSON.parse(JSON.parse(data).o);
				//console.log(getRespData)
				if (getRespData.length !== undefined) {
					getRespData.forEach(respData => {
						console.log(respData.Symbol)
					})
					//	return;
					var pairArr = ['XEMBTC', 'LTCUSD', 'DASHBTC', 'BCHB2BX', 'EOSETH', 'XMRUSDC', 'BCHEUR', 'XMREUR', 'BTCUSD', 'XRPUSDC', 'DASHUSD', 'B2BXBTC', 'ETHEUR', 'ADAB2BX', 'XLMB2BX', 'XRPB2BX', 'EOSUSDT', 'BTCEUR', 'ZECB2BX', 'ADAETH', 'ETHUSDT', 'XLMEUR', 'ZECUSDC', 'ADAEUR', 'LTCUSDC', 'ADABTC', 'B2BXUSDT', 'ZECUSD', 'XEMB2BX', 'XMRUSD', 'SRNTBTC', 'B2BXETH', 'BCHBTC', 'XRPUSDT', 'XLMBTC', 'LTCBTC', 'BTCUSDC', 'EOSUSD', 'BCHUSDC', 'ETHUSDC', 'XLMUSDC', 'EOSEUR', 'XMRBTC', 'EOSUSDC', 'EOSBTC', 'XRPBTC', 'LTCEUR', 'DASHUSDT', 'SRNTETH', 'ZECETH', '', 'DASHB2BX', 'ADAUSD', 'ZECUSDT', 'XRPUSD', 'BCHUSD', 'XRPEUR', 'ETHUSD', 'LTCB2BX', 'DASHEUR', 'B2BXUSDC', 'BCHUSDT', 'ETHBTC', 'USDTUSDC', 'ZECBTC', 'BTCUSDT', 'XMRUSDT', 'LTCUSDT', 'XLMUSD', 'XMRB2BX', 'XLMUSDT', 'EOSB2BX', 'ZECEUR']
					for (let i = 0; i <= pairArr.length; i++) {
						getRespData.forEach(respData => {
							if (pairArr[i] === respData.Symbol) {
								const filter = { Symbol: pairArr[i] };
								console.log('respData', respData)
								let obje = { OMSId: respData.OMSId, InstrumentId: respData.InstrumentId, Symbol: respData.Symbol, Product1Symbol: respData.Product1Symbol, Product2Symbol: respData.Product2Symbol, SessionStatus: respData.SessionStatus, SessionStatusDateTime: respData.SessionStatusDateTime }
								BbxPairSchema.findOneAndUpdate(filter, obje, {
									new: true,
									upsert: true // Make this update into an upsert
								}, function (err, pairsData) {
									if (err) { console.log('myerror', err); }
									else { console.log('updated', pairsData); }
								});
							}
						});
					}
				}
			})

			wss.on('error', (e) => {
				console.log("bbx wss error found");
				console.log(e);
			});
		}

		else {
			//	console.log("request response failed Trade Id===>" + genTradeId);

		}
	});

}

//checkPairsB2bx();

let updateB2bxPriceCron = function (req, res) {
	//console
	//	var getSettingData = function(req, res){
	console.log(req.params.pair)
	let colval = 'b2bx' + req.params.pair + 'BuyPrice';
	SettingSchema.findOne({ colName: colval }).exec(function (err, users) {
		if (err) {
			console.log(err);
			res.status(500).json({ status: "invalid request" });
		} else {
			console.log('colval', users)
			res.send(users);
		}

	});
	//  }

}

/**
* Send bitcoin from user personal account to trade account and transfer it to admin quick exchange account
*/

let transferBitcoinForQuickExchange = async (req, res, next) => {
	try {
		let adminBtcAccount = AdminDetailsForTrade.btc.name;
		let { btcamount } = req.body;
		let wallets = await Wallets.findOne({ _id: req.user.id });
		//	wallet.find({ "wallets.litecoin.address": matchAddress }).exec(async function (walletErr, walletData) {
		if (wallets.bitcoin) {
			const btcBalance = await getBTCBalance(wallets.bitcoin.name);
			if (btcamount > btcBalance) {
				res.status(200).json({ status: false, msg: "Your balance is insufficent", type: 'balance is not sufficent' });
			} else {
				// move btc from user to admin
				//	let result = await moveBTCAmount(wallets.bitcoin.name, adminBtcAccount, btcamount, 1);
				let result = await transferBTCAmount(wallets.bitcoin.name, adminBtcAccount, btcamount, 1);
				if (result) {
					// add balance to User trade wallet start        
					let addToUserTradeWallet = new Trade({
						userId: req.user.id,
						cryptoAmount: btcamount,
						cryptoType: 'BTC',
						txType: 'privateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToUserTradeWallet.save((err) => {
						if (err) {
							console.log(err);
						} else {
							res.status(200).json({ success: true, msg: `${btcamount} bitcoin added to your trade wallet` });
						}
					});
					// add to admin Trade wallet
					let getAdminId = "5bea69e0b41cdf516fab6b69";
					let addToAdminTradeWallet = new AdminQuickExchangeWallet({
						userId: req.user.id,
						tradeId: addToUserTradeWallet.id,
						cryptoAmount: btcamount,
						cryptoType: 'BTC',
						txType: 'userPrivateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToAdminTradeWallet.save((err) => {
						if (err) {
							res.status(200).json({ success: false, msg: err, type: 'error in saving' })
						} else {
							res.status(200).json({ success: true, msg: "Amount transferred" });
						}
					});
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
}



/**
* Transfer Ethereum from user personal account to trade account and transfer it to admin quick exchange account
*/

let transferEthereumForQuickExchange = async function (req, res) {
	var admminEthAccount = AdminDetailsForTrade.eth.name;
	var admminEthAddress = AdminDetailsForTrade.eth.address;
	let { ethamount } = req.body;
	User.findById(req.user.id, async function (err, user) {
		if (err) {
			res.status(200).json({ status: "false", msg: "Insufficient Balance" });
		} else {
			var userEthAddress = user.wallets.ethereum.address;
			var userEthPassword = user.wallets.ethereum.password;
			await getBalance(userEthAddress).then(async function (balance) {
				var amoutToTransfer = ethamount;
				var realBalance = balance / 1000000000000000000;
				if (amoutToTransfer > realBalance) {
					res.status(200).json({ status: "false", msg: "Insufficient Balance" });
				}
				else {
					await unlockAddress(userEthAddress, userEthPassword).then(async function (unlock) {
						//console.log(data.wallets.bitcoin.name);
						await sendTransaction(userEthAddress, admminEthAddress, amoutToTransfer).then(function (data) {

							// add balance to User trade wallet start		
							var addToUserTradeWallet = new Trade({
								userId: req.user.id,
								cryptoAmount: amoutToTransfer,
								cryptoType: 'eth',
								txType: 'privateWallet',
								txId: data.transactionHash,
								type: 'credit',
								status: "completed"
							});
							addToUserTradeWallet.save(function (err) {
							});
							// add to admin Trade wallet
							var getAdminId = "5bea69e0b41cdf516fab6b69";
							let addToAdminTradeWallet = new AdminQuickExchangeWallet({
								userId: req.user.id,
								tradeId: addToUserTradeWallet.id,
								cryptoAmount: ethamount,
								cryptoType: 'ETH',
								txType: 'userPrivateWallet',
								txId: data.transactionHash,
								type: 'credit',
								status: "completed"
							});
							addToAdminTradeWallet.save((err) => {
								if (err) {
									res.status(200).json({ success: false, msg: err, type: 'error in saving' })
								} else {
									res.status(200).json({ success: true, msg: "Amount transferred" });
								}
							});
						}).catch(function (err) {
							res.status(200).json({ status: "false", msg: "Insufficient Balance", getdata: err });
						});
						//  console.log(result);
					}).catch(function (err) {
						res.status(200).json({ status: "false", msg: "Insufficient Balance", getdata: err });
					});
				}
			}).catch(function (err) {
				res.status(200).json({ status: "false", msg: "insufficient balance" });
			})

		}
	});
}

/**
* Send litecoin from user personal account to trade account and transfer it to admin quick exchange account
*/

let transferLitecoinForQuickExchange = async (req, res, next) => {
	try {
		let adminBtcAccount = AdminDetailsForTrade.ltc.name;
		let { ltcamount } = req.body;
		let wallets = await Wallets.findOne({ _id: req.user.id });
		//	wallet.find({ "wallets.litecoin.address": matchAddress }).exec(async function (walletErr, walletData) {
		if (wallets.bitcoin) {
			const ltcBalance = await getBTCBalance(wallets.bitcoin.name);
			if (ltcamount > ltcBalance) {
				res.status(200).json({ status: false, msg: "Your balance is insufficent", type: 'balance is not sufficent' });
			} else {
				// move btc from user to admin
				//	let result = await moveBTCAmount(wallets.bitcoin.name, adminBtcAccount, btcamount, 1);
				let result = await transferAmount(wallets.bitcoin.name, adminBtcAccount, ltcamount, 1);
				if (result) {
					// add balance to User trade wallet start        
					let addToUserTradeWallet = new Trade({
						userId: req.user.id,
						cryptoAmount: ltcamount,
						cryptoType: 'LTC',
						txType: 'privateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToUserTradeWallet.save((err) => {
						if (err) {
							console.log(err);
						} else {
							res.status(200).json({ success: true, msg: `${ltcamount} bitcoin added to your trade wallet` });
						}
					});
					// add to admin Trade wallet
					let getAdminId = "5bea69e0b41cdf516fab6b69";
					let addToAdminTradeWallet = new AdminQuickExchangeWallet({
						userId: req.user.id,
						tradeId: addToUserTradeWallet.id,
						cryptoAmount: ltcamount,
						cryptoType: 'LTC',
						txType: 'userPrivateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToAdminTradeWallet.save((err) => {
						if (err) {
							res.status(200).json({ success: false, msg: err, type: 'error in saving' })
						} else {
							res.status(200).json({ success: true, msg: "Amount transferred" });
						}
					});
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
}

/**
* Send Bitcoincash from user personal account to trade account and transfer it to admin quick exchange account
*/

let transferBitcoinCashForQuickExchange = async (req, res, next) => {
	try {
		let adminBtcAccount = AdminDetailsForTrade.ltc.name;
		let { ltcamount } = req.body;
		let wallets = await Wallets.findOne({ _id: req.user.id });
		//	wallet.find({ "wallets.litecoin.address": matchAddress }).exec(async function (walletErr, walletData) {
		if (wallets.bitcoin) {
			const ltcBalance = await getBTCBalance(wallets.bitcoin.name);
			if (ltcamount > ltcBalance) {
				res.status(200).json({ status: false, msg: "Your balance is insufficent", type: 'balance is not sufficent' });
			} else {
				// move btc from user to admin
				//	let result = await moveBTCAmount(wallets.bitcoin.name, adminBtcAccount, btcamount, 1);
				let result = await transferAmount(wallets.bitcoin.name, adminBtcAccount, ltcamount, 1);
				if (result) {
					// add balance to User trade wallet start        
					let addToUserTradeWallet = new Trade({
						userId: req.user.id,
						cryptoAmount: ltcamount,
						cryptoType: 'BCH',
						txType: 'privateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToUserTradeWallet.save((err) => {
						if (err) {
							console.log(err);
						} else {
							res.status(200).json({ success: true, msg: `${ltcamount} bitcoin added to your trade wallet` });
						}
					});
					// add to admin Trade wallet
					let getAdminId = "5bea69e0b41cdf516fab6b69";
					let addToAdminTradeWallet = new AdminQuickExchangeWallet({
						userId: req.user.id,
						tradeId: addToUserTradeWallet.id,
						cryptoAmount: ltcamount,
						cryptoType: 'LTC',
						txType: 'userPrivateWallet',
						txId: result,
						type: 'credit',
						status: "completed"
					});
					addToAdminTradeWallet.save((err) => {
						if (err) {
							res.status(200).json({ success: false, msg: err, type: 'error in saving' })
						} else {
							res.status(200).json({ success: true, msg: "Amount transferred" });
						}
					});
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
}


function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			return false;
	}
	return true;
}

/**
 * calculating user trade balance and returning it
 * @param userId 
 */
let userCryptoTradeBal = async (req, res) => {

	let { id } = req.user;
	let { cryptoType1 } = req.body;
	let { cryptoType2 } = req.body;
	let { cryptoType3 } = req.body;
	let { cryptoType4 } = req.body;
	//let j = 4;
	var balanceResult = [];
	var cryptoObj = [cryptoType1, cryptoType2, cryptoType3, cryptoType4];
	//console.log('i am here in api',req.body)
	try {
		let totalAmountBTC = 0;
		let totalAmountLTC = 0;
		let totalAmountETH = 0;
		let totalAmountUSDT = 0;
		//	for (let i=1;i<=j;j++){
		//	await cryptoObj.forEach( async cryptoType => {

		await Trade.find({ userId: id, cryptoType: cryptoType1, status: 'completed' }).then((userTradeBalance) => {
			if (isEmpty(userTradeBalance)) {
			} else {
				userTradeBalance.forEach((value) => {
					totalAmountBTC = totalAmountBTC + value['cryptoAmount'];
				});
				///balanceResult.push(totalAmount);
				//console.log('totalAmount',balanceResult)
			}
		}).catch((error) => {
			console.log(error);
		});

		await Trade.find({ userId: id, cryptoType: cryptoType2, status: 'completed' }).then((userTradeBalance) => {
			if (isEmpty(userTradeBalance)) {
			} else {
				userTradeBalance.forEach((value) => {
					totalAmountLTC = totalAmountLTC + value['cryptoAmount'];
				});
				///balanceResult.push(totalAmount);
				//	console.log('totalAmount',balanceResult)
			}
		}).catch((error) => {
			console.log(error);
		});

		await Trade.find({ userId: id, cryptoType: cryptoType3, status: 'completed' }).then((userTradeBalance) => {
			if (isEmpty(userTradeBalance)) {
			} else {
				userTradeBalance.forEach((value) => {
					totalAmountETH = totalAmountETH + value['cryptoAmount'];
				});
				///balanceResult.push(totalAmount);
				//console.log('totalAmount',balanceResult)
			}
		}).catch((error) => {
			console.log(error);
		});

		await Trade.find({ userId: id, cryptoType: cryptoType4, status: 'completed' }).then((userTradeBalance) => {
			if (isEmpty(userTradeBalance)) {
			} else {
				userTradeBalance.forEach((value) => {
					totalAmountUSDT = totalAmountUSDT + value['cryptoAmount'];
				});
				///balanceResult.push(totalAmount);
				//	console.log('totalAmount',balanceResult)
			}
		}).catch((error) => {
			console.log(error);
		});

		//}
		//});

		res.status(200).json({ success: true, msg: "Balance fetched successfully.", balance: { totalAmountBTC, totalAmountLTC, totalAmountETH, totalAmountUSDT } });

	} catch (error) {
	}
};


var getAllPairs = async function (req, res) {

	try {
		var notPairArray = [];
		var pairProviderArray = [];
		var pairArrayCurrencies = [];
		var pairArrayCurrency1 = [];
		var pairArrayCurrency2 = [];
		await Currency.find({ type: { $ne: "erc20" } }).then(async (allCurrencies) => {
			if (isEmpty(allCurrencies)) {
			} else {
				await allCurrencies.forEach((value) => {
					if (pairArrayCurrency1 !== pairArrayCurrency2) {
						pairArrayCurrency1.push(value.symbol);
						pairArrayCurrency2.push(value.symbol);
					}
				});

				await pairArrayCurrency1.forEach((pairArr1Element) => {
					pairArrayCurrency2.forEach((pairArr2Element) => {
						if (pairArr1Element !== pairArr2Element) {
							pairArrayCurrencies.push(pairArr1Element + "_" + pairArr2Element);
						}
					})
				});
			}
		}).catch((error) => {
			res.status(200).json({ success: false, msg: 'Something went wrong!', type: "in catch" });
		});
		await ProvidersPairFee.find({}, { pairName: 1, _id: 0 }).then((pairProvider) => {
			if (pairProvider.length <= 0) {
				res.status(200).json(pairArrayCurrencies);
			} else {
				pairProvider.forEach((pairProviderElement) => {
					pairProviderArray.push(pairProviderElement.pairName);
				})
				for (let i = 0; i < pairProviderArray.length; i++) {
					for (let j = 0; j < pairArrayCurrencies.length; j++) {
						if (pairArrayCurrencies[j] !== pairProviderArray[i]) {
							if (notPairArray.indexOf(pairArrayCurrencies[j]) < 0 && pairProviderArray.indexOf(pairArrayCurrencies[j]) < 0) {
								notPairArray.push(pairArrayCurrencies[j]);
							}
						}
					}
				}
				res.status(200).json(notPairArray);
			}
		}).catch((error) => {
			res.status(200).json({ success: false, msg: 'Something went wrong!', type: "in catch" });
		});
	} catch (error) {
		res.status(200).json({ success: false, msg: 'Something went wrong!', type: "in catch" });
	}

}

/**
 *  create every time a new admin credentials
 */
let addTradeBalance = async (req, res, next) => {
    try {
		
        let { id , topUpamount, cryptoType } = req.body;
        // let salt = await bcrypt.genSaltSync(10);
        // let hashPassword = await bcrypt.hashSync(password, salt);
	//	var idd = Object(id);
	 var ObjectID = require('mongodb').ObjectID;
	var userrId = new ObjectID(id);
//doc._id = new ObjectID(doc._id); // wrap in ObjectID
		let addToUserTradeWallet = new Trade({
			userId: userrId,
			cryptoAmount: topUpamount,
			euroAmount: 0,
			cryptoCurrentPrice: 0,
			cryptoType: cryptoType,
			txType: 'privateWallet',
			txId: 'no',
			type: 'credit',
			status: "completed"
		});
		addToUserTradeWallet.save(async (err, sendDoc) => {
			if (err) {
				res.status(200).json({ success: false, msg: err, type: 'error in saving' })
			} else {
                res.status(200).json({ success: true, msg: 'New entry created successfully!', type: 'new entry' })
            }
        });
    } catch (error) {
        console.log(error);
    }
};

var feesForProvider = async (req, res, next) => {
	//let {pair} = req.body;
	var pair = req.params.pair;
	AllowTradeByAdmin.findOne({ pairName: pair }).populate('pairId').then(async (allowProvider) => {
		
		res.status(200).json({ allowProvider: allowProvider, status: true })

		//console.log('allowProvider',allowProvider)
		// if (allowProvider.exmo === true) {
		// 	if (allowProvider.pairId) {
			
		// 	}
		// }
	}).catch((error) => {
		res.status(200).json({ success: false, msg: 'Error in fetching provider!', type: "provider" });
	});

}

var unq = async function () {
	var uniq = uniqueid('')
var second = uniqueid('suffix')
	// console.log(uniqueString()+uniq()+second());
}
// this.unq();
//this.checkPairsB2bx();


//this.updateB2bxPrice();
//this.getSettledMarketOrder();
// this.getSettledMarketOrderS();


//chartData();
// setInterval(function () {
// 	//updateB2bxPrice();
// }, 1000);

export {
	getmarketOrder,
	updatePriceCron,
	updateOrdersCron1,
	receiveLimitOrdersList,
	receiveLimitOrdersListCompleted,
	orderData,
	chartData,
	receiveOrdersList,
	sendDataExchange,
	marketOrder,
	getSettledMarketOrder,
	withdrawalBitcoinFromExchangeTrade,
	transferBitcoinForExchangeTrade,
	transferLitecoinForQuickExchange,
	updateB2bxPrice,
	transferBitcoinForQuickExchange,
	transferEthereumForQuickExchange,
	updateB2bxPriceCron,
	checkPairsB2bx,
	userCryptoTradeBal,
	getAllPairs,
	unq,
	addTradeBalance,
	orderDataWallebi,
	feesForProvider
};
