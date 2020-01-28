import { init_exmo, api_query, cancelOrder, fetchUserInfo } from "../../services/Liquidity Service/exmo.service";
import { TradeFromLiquidity } from "../../db/models/Wallets/trade.liquidity.model";
import { Trade } from "../../db/models/Wallets/trade.model";
import { FiatTransactions } from "../../db/models/Wallets/fiat.transactions.model";
import { ioSocketss } from "../..";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { userFiatBalance } from "../Wallets/euroController";
import { FiatWallet } from "../../db/models/Wallets/fiat.wallet.model";



init_exmo({ key: 'K-5a08deabfbc5910737601c1a1cdc764a255ab3bb', secret: 'S-8fbb575d4773a42120441d936df10fef793245a5' });



// cancelOrder('user_info', {}, (res) => {
//     console.log(JSON.parse(res).balances.BTC);
// });


let sendOrderToExmo = async (id, euroAmount, cryptoCurrencyPrice, cryptoAmountQuantity, pair, orderType, buyOrSell, symbol, fee) => {
    return new Promise(async (resolve, reject) => {
        try {
            api_query("order_create", { "pair": pair, "quantity": cryptoAmountQuantity, "price": cryptoCurrencyPrice, "type": orderType }, function (result) {
                if (JSON.parse(result).result === true) {
                    let setOrderType: any;
                    let setType: any;
                    let setCryptoAmountQuantity: any;
                    if (buyOrSell === 0) {
                        setOrderType = "buy";
                        setType = "credit";
                        setCryptoAmountQuantity = cryptoAmountQuantity;
                    } else {
                        setOrderType = "sell";
                        setType = "debit";
                        setCryptoAmountQuantity = -cryptoAmountQuantity;
                    }
                    let saveTradeLiquidity = new TradeFromLiquidity({
                        amount: cryptoAmountQuantity,
                        cryptoamount: setCryptoAmountQuantity,
                        orderId: JSON.parse(result).order_id,
                        errormsg: "",
                        cryptotype: symbol,
                        ordertype: setOrderType,
                        type: setType,
                        responsedata: result,
                        status: "Accepted",
                        providerFee: fee
                    });
                    saveTradeLiquidity.save(async (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            let providerId = saveTradeLiquidity._id;
                            if (buyOrSell == 0) {
                                let addTradeCryptoToUser = new Trade({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: cryptoAmountQuantity,
                                    cryptoType: symbol,
                                    cryptoCurrentPrice: cryptoCurrencyPrice,
                                    euroAmount: euroAmount,
                                    type: 'credit',
                                    status: "completed",
                                    txFee: fee,
                                });
                                addTradeCryptoToUser.save(async function (err, tradeProvider) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        await userCryptoTradeBalance(id, symbol).then(async (userCryptoBalance) => {
                                            if (userCryptoBalance) {
                                                await TradeWallet.findOneAndUpdate({ userId: id, symbol: symbol }, { balance: userCryptoBalance }, { new: true }).then(async (result) => {
                                                    await userFiatBalance(id).then(async (balance) => {
                                                        await FiatWallet.findOneAndUpdate({ userId: id, symbol: 'EUR' }, { balance: balance }, { new: true }).then((result) => {
                                                            if (result) {
                                                                resolve({ success: true, msg: `${cryptoAmountQuantity} credit to your ${symbol} wallet!` });
                                                                ioSocketss.emit(`fiatTransaction_${id}`, { symbol: symbol, transaction: tradeProvider });
                                                                ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: symbol, transaction: result, balance: userCryptoBalance });
                                                            }
                                                        }).catch((error) => {
                                                            reject({ success: false, msg: 'Something went wrong!', type: 'fiat update catch' })
                                                        });
                                                    }).catch((error) => {
                                                        reject({ success: false, msg: 'Something went wrong!', type: 'fiat find catch' });
                                                    });
                                                }).catch((error) => {
                                                    reject({ success: false, msg: 'Something went wrong!', type: 'trade update catch' })
                                                });
                                            }
                                        }).catch((error) => {
                                            reject({ success: false, msg: 'Something went wrong!', type: 'trade find catch' })
                                        });
                                    }
                                });
                            } else {
                                let AddEuroToUserFiatWallet = new FiatTransactions({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: cryptoAmountQuantity,
                                    currency: 'EUR',
                                    cryptoCurrentPrice: cryptoCurrencyPrice,
                                    amount: euroAmount,
                                    type: 'credit',
                                    status: "completed",
                                    txType: 'sell',
                                });
                                AddEuroToUserFiatWallet.save(async function (err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        let addTradeCryptoToUser = new Trade({
                                            userId: id,
                                            providerId: providerId,
                                            cryptoAmount: -cryptoAmountQuantity,
                                            cryptoType: symbol,
                                            cryptoCurrentPrice: cryptoCurrencyPrice,
                                            euroAmount: euroAmount,
                                            type: 'debit',
                                            status: "completed",
                                            txFee: fee,
                                        });
                                        addTradeCryptoToUser.save(async function (err, fiatresult) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                await userCryptoTradeBalance(id, symbol).then(async (userCryptoBalance) => {
                                                    if (userCryptoBalance) {
                                                        await TradeWallet.findOneAndUpdate({ userId: id, symbol: symbol }, { balance: userCryptoBalance }, { new: true }).then(async (result) => {
                                                            await userFiatBalance(id).then(async (balance) => {
                                                                await FiatWallet.findOneAndUpdate({ userId: id, symbol: 'EUR' }, { balance: balance }, { new: true }).then((result) => {
                                                                    if (result) {
                                                                        resolve({ success: true, msg: `${euroAmount} credit to your Euro wallet!` });
                                                                        ioSocketss.emit(`fiatTransaction_${id}`, { symbol: symbol, transaction: fiatresult });
                                                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { symbol: symbol, transaction: result, balance: userCryptoBalance });
                                                                    }
                                                                }).catch((error) => {
                                                                    reject({ success: false, msg: 'Something went wrong!', type: 'fiat update catch' })
                                                                });
                                                            }).catch((error) => {
                                                                reject({ success: false, msg: 'Something went wrong!', type: 'fiat find catch' });
                                                            });
                                                        }).catch((error) => {
                                                            reject({ success: false, msg: 'Something went wrong!', type: 'trade update catch' })
                                                        });
                                                    }
                                                }).catch((error) => {
                                                    reject({ success: false, msg: 'Something went wrong!', type: 'trade find catch' })
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                } else {
                    reject({ success: false, msg: 'Something went wrong!' });
                }
            });
        } catch (error) {
            reject({ success: false, msg: 'Something went wrong!' });
        }
    });
}




let sendOrderToEmxmoForExchange = async (id, marketDataPair, marketDataType, marketDataQuantity, firstCrypto, marketDataPrice, secondCrypto) => {
   // return;
    return new Promise(async (resolve, reject ) => {
        try {
            var marketPair = marketDataPair.replace('-', '_');
            if(marketDataType == 'Buy'){
                var marketOrderType = "market_buy"
            } else {
                var marketOrderType = "market_sell"
            }
            api_query("order_create", { "pair": marketPair, "quantity": marketDataQuantity, "price": marketDataPrice, "type": marketOrderType }, function (result) {
                if (JSON.parse(result).result === true) {
                    let setOrderType: any;
                    let setType: any;
                    let typeOfCrypto: any;
                    let setCryptoAmountQuantity: any;
                    if (marketOrderType == 'market_buy') {
                        setOrderType = "buy";
                        setType = "credit";
                        setCryptoAmountQuantity = marketDataQuantity;
                        typeOfCrypto = firstCrypto
                    } else {
                       setOrderType = "sell";
                       setType = "debit";
                       setCryptoAmountQuantity = -marketDataQuantity*marketDataPrice;
                       typeOfCrypto = secondCrypto
                    }
                    let saveTradeLiquidity = new TradeFromLiquidity({
                        amount: marketDataQuantity,
                        cryptoamount: setCryptoAmountQuantity,
                        orderId: JSON.parse(result).order_id,
                        errormsg: "",
                        cryptotype: typeOfCrypto,
                        ordertype: setOrderType,
                        type: setType,
                        responsedata: result,
                        status: "Accepted",
                        providerFee: 0
                    });
                    saveTradeLiquidity.save(async (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            let providerId = saveTradeLiquidity._id;
                            if (setOrderType == 'buy') {
                           
                                let addTradeCryptoToUserAccount = new Trade({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: setCryptoAmountQuantity,
                                    cryptoType: firstCrypto,
                                    cryptoCurrentPrice: marketDataPrice,
                                    euroAmount: 0,
                                    type: 'credit',
                                    status: "completed",
                                    txFee: 0,
                                    txId : JSON.parse(result).order_id
                                });
                                addTradeCryptoToUserAccount.save(async function (err, tradeProvider) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        await userCryptoTradeBalance(id, firstCrypto).then(async (userethereumBalance) => {
                                            if (userethereumBalance) {
                                                await TradeWallet.findOneAndUpdate({ userId:id, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
                                                    if (result) {
                                                    }
                                                }).catch((error) => {
                                                });
                                            }
                                        }).catch((error) => {
                                        });
                                        //resolve({success: true, msg: `${cryptoAmountQuantity} credit to your ${symbol} wallet!`});
                                        ioSocketss.emit("limitorder", "limitorder");
                                    }
                                });

                                let addTradeCryptoToUserAccount1 = new Trade({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: -setCryptoAmountQuantity*marketDataPrice,
                                    cryptoType: secondCrypto,
                                    cryptoCurrentPrice: marketDataPrice,
                                    euroAmount: 0,
                                    type: 'debit',
                                    status: "completed",
                                    txFee: 0,
                                    txId : JSON.parse(result).order_id
                                });
                                addTradeCryptoToUserAccount1.save(async function (err, fiatresult) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        await userCryptoTradeBalance(id, secondCrypto).then(async (userethereumBalance) => {
                                            if (userethereumBalance) {
                                                await TradeWallet.findOneAndUpdate({ userId:id, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
                                                    if (result) {
                                                    }
                                                }).catch((error) => {
                                                });
                                            }
                                        }).catch((error) => {
                                        });
                                       // resolve({success: true, msg: `${cryptoAmountQuantity} credit to your ${symbol} wallet!`});
                                       ioSocketss.emit("limitorder", "limitorder");
                                    }
                                });
                            } else {
                                let addTradeCryptoToUserAccount = new Trade({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: -setCryptoAmountQuantity,
                                    cryptoType: firstCrypto,
                                    cryptoCurrentPrice: marketDataPrice,
                                    euroAmount: 0,
                                    type: 'debit',
                                    status: "completed",
                                    txFee: 0,
                                    txId : JSON.parse(result).order_id
                                });
                                addTradeCryptoToUserAccount.save(async function (err, tradeProvider) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        await userCryptoTradeBalance(id, firstCrypto).then(async (userethereumBalance) => {
                                            if (userethereumBalance) {
                                                await TradeWallet.findOneAndUpdate({ userId:id, symbol: firstCrypto }, { balance: userethereumBalance }).then((result) => {
                                                    if (result) {
                                                    }
                                                }).catch((error) => {
                                                });
                                            }
                                        }).catch((error) => {
                                        });
                                        //resolve({success: true, msg: `${cryptoAmountQuantity} credit to your ${symbol} wallet!`});
                                        ioSocketss.emit("limitorder", "limitorder");
                                    }
                                });

                                let addTradeCryptoToUserAccount1 = new Trade({
                                    userId: id,
                                    providerId: providerId,
                                    cryptoAmount: setCryptoAmountQuantity*marketDataPrice,
                                    cryptoType: secondCrypto,
                                    cryptoCurrentPrice: marketDataPrice,
                                    euroAmount: 0,
                                    type: 'credit',
                                    status: "completed",
                                    txFee: 0,
                                    txId : JSON.parse(result).order_id
                                });
                                addTradeCryptoToUserAccount1.save(async function (err, fiatresult) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        await userCryptoTradeBalance(id, secondCrypto).then(async (userethereumBalance) => {
                                            if (userethereumBalance) {
                                                await TradeWallet.findOneAndUpdate({ userId:id, symbol: secondCrypto }, { balance: userethereumBalance }).then((result) => {
                                                    if (result) {
                                                    }
                                                }).catch((error) => {
                                                });
                                            }
                                        }).catch((error) => {
                                        });
                                       // resolve({success: true, msg: `${cryptoAmountQuantity} credit to your ${symbol} wallet!`});
                                       ioSocketss.emit("limitorder", "limitorder");
                                    }
                                });
                            }
                        }
                    });
                } else {
                    reject({success: false, message: 'Something went wrong!'});
                }
            });
            resolve({success: true})
        } catch (error) {
            reject({success: false, msg: 'Something went wrong!'});
        }
    });
};



fetchUserInfo('user_info', {}, (res) => {
        console.log(res);
});



export {
    sendOrderToExmo,
    sendOrderToEmxmoForExchange
}

