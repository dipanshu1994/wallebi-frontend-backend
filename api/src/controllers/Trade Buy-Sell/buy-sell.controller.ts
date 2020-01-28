import { userFiatBalance } from "../Wallets/euroController";
import { Wallets } from "../../db/models/Wallets/wallet.model";
import { AllowTradeByAdmin } from "../../db/models/Wallets/allow.trade.provider.model";
import { ProvidersPairFee } from "../../db/models/exchangeSchema/provider.pair.fee.model";
import { Trade } from "../../db/models/Wallets/trade.model";
import { FiatTransactions } from "../../db/models/Wallets/fiat.transactions.model";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import { FiatWallet } from "../../db/models/Wallets/fiat.wallet.model";
import { ioSocketss } from "../..";
import { sendOrderToExmo } from "./liqudity.controller";




function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}




/**
 * fetching liquidity provider & currency for admin
 * @param req 
 * @param res 
 * @param next 
 */
let activatedProvider = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search } = req.query;
        let pgNo = Number(pageIndex);//|| 1;
        let recordPerPage = Number(pageSize);// || 4;
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = {};
        } else {
            filter = { $or: [{ pairName: { $regex: search, '$options': 'i' } }] };
        }
        await AllowTradeByAdmin.find(filter).populate('pairId').skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 }).then(async (providers) => {
            await AllowTradeByAdmin.find().countDocuments().then((count) => {
                res.status(200).json({ pair: providers, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
            }).catch((error) => {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
            });
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in main catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in main catch' });
    }
};




/**
 * change provider status active to inactive
 * @param req 
 * @param res 
 * @param next 
 */
let changeProviderStatus = async (req, res, next) => {
    try {
        let { _id, provider, status } = req.body;
        let updateObj = {};
        if (provider === 'admin') {
            updateObj = {
                admin: status
            }
        } else if (provider === 'b2bx') {
            updateObj = {
                b2bx: status
            }
        } else {
            updateObj = {
                exmo: status
            }
        }
        AllowTradeByAdmin.findByIdAndUpdate(_id, updateObj).then((result) => {
            let msg: any;
            if (status === true) {
                msg = 'enable';
            } else {
                msg = 'disable';
            }
            res.status(200).json({ success: true, msg: `${provider} is now ${msg}` });
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
};




/**
 * saving provider fee in our DB for every pair
 * @param req 
 * @param res 
 * @param next 
 */
let saveProvidersPairFee = async (req, res, next) => {
    try {
        let { pairName, adminBuyFee, adminBuyFeeIn, adminSellFee, adminSellFeeIn, b2bxBuyFee, b2bxBuyFeeIn, b2bxSellFee, b2bxSellFeeIn, exmoBuyFee, exmoBuyFeeIn, exmoSellFee, exmoSellFeeIn } = req.body;
        await ProvidersPairFee.findOne({ pairName: pairName }).then((pair) => {
            if (pair) {
                res.status(200).json({ success: false, msg: `${pairName} fee is already exsit!`, type: 'main catch' });
            } else {
                let newPairFee = new ProvidersPairFee({
                    pairName: pairName,
                    adminBuyFee: adminBuyFee,
                    adminBuyFeein: adminBuyFeeIn,
                    adminSellFee: adminSellFee,
                    adminSellFeein: adminSellFeeIn,
                    b2bxBuyFee: b2bxBuyFee,
                    b2bxBuyFeein: b2bxBuyFeeIn,
                    b2bxSellFee: b2bxSellFee,
                    b2bxSellFeein: b2bxSellFeeIn,
                    exmoBuyFee: exmoBuyFee,
                    exmoBuyFeein: exmoBuyFeeIn,
                    exmoSellFee: exmoSellFee,
                    exmoSellFeein: exmoSellFeeIn,
                });

                newPairFee.save((err, result) => {
                    if (err) {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
                    } else {
                        activateLiquidityProvider(req, res, next, result)
                    }
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
};



/**
 * enable multiple liquidity provider in currency
 * @param req 
 * @param res 
 * @param next 
 */
let activateLiquidityProvider = async (req, res, next, result) => {
    try {
        await AllowTradeByAdmin.findOne({ pairName: result.pairName }).then((provider) => {
            if (provider) {
                res.json({ msg: 'already' })
            } else {

                let newBuyProvider = new AllowTradeByAdmin({
                    pairId: result._id,
                    pairName: result.pairName,
                    tradeType: `Buy`,
                });

                newBuyProvider.save((error, provider) => {
                    if (error) {
                        res.status(200).json({ success: false, msg: 'something went wrong!' });
                    } else {

                    }
                });


                let newSellProvider = new AllowTradeByAdmin({
                    pairId: result._id,
                    pairName: result.pairName,
                    tradeType: `Sell`,
                });

                newSellProvider.save((error, provider) => {
                    if (error) {
                        res.status(200).json({ success: false, msg: 'something went wrong!' });
                    } else {
                        res.status(200).json({ success: true, msg: `${provider.pairName} fees & provider added successfully!` });
                    }
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'something went wrong!' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'something went wrong!' });
    }
};


/**
 * fetching all pairs, providers & fees
 * @param req 
 * @param res 
 * @param next 
 */
let getAllPairsProvidersFee = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search } = req.query;
        let pgNo = Number(pageIndex);//|| 1;
        let recordPerPage = Number(pageSize);// || 4;
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = {};
        } else {
            filter = { $or: [{ pairName: { $regex: search, '$options': 'i' } }] };
        }
        await ProvidersPairFee.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdAt: -1 }).then(async (providers) => {
            await ProvidersPairFee.find().countDocuments().then((count) => {
                res.status(200).json({ pair: providers, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
            }).catch((error) => {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
            });
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
};


/**
 * getting unique pair all providers & already added 
 * @param req 
 * @param res 
 * @param next 
 */
let uniquePairDetails = async (req, res, next) => {
    try {
        let { id } = req.query;
        await ProvidersPairFee.findById(id).then((result) => {
            res.status(200).json(result);
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
};




/**
 * update pair fee of providers
 * @param req 
 * @param res 
 * @param next 
 */
let updateProvidersPairFee = async (req, res, next) => {
    try {
        let { pairId, pairName, adminBuyFee, adminBuyFeeIn, adminSellFee, adminSellFeeIn, b2bxBuyFee, b2bxBuyFeeIn, b2bxSellFee, b2bxSellFeeIn, exmoBuyFee, exmoBuyFeeIn, exmoSellFee, exmoSellFeeIn } = req.body;
        let updateObj = {
            adminBuyFee: adminBuyFee,
            adminBuyFeein: adminBuyFeeIn,
            adminSellFee: adminSellFee,
            adminSellFeein: adminSellFeeIn,
            b2bxBuyFee: b2bxBuyFee,
            b2bxBuyFeein: b2bxBuyFeeIn,
            b2bxSellFee: b2bxSellFee,
            b2bxSellFeein: b2bxSellFeeIn,
            exmoBuyFee: exmoBuyFee,
            exmoBuyFeein: exmoBuyFeeIn,
            exmoSellFee: exmoSellFee,
            exmoSellFeein: exmoSellFeeIn
        };
        ProvidersPairFee.findOneAndUpdate({ _id: pairId, pairName: pairName }, updateObj, { new: true }).then((updatedPair) => {
            if (updatedPair) {
                res.status(200).json({ success: true, msg: `${updatedPair.pairName} pair is updated successfully!`, type: 'updated' });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'something went wrong!' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'something went wrong!' });
    }
};




/**
 * enable & disable pair
 * @param req 
 * @param res 
 * @param next 
 */
let updatePairStatus = async (req, res, next) => {
    try {
        let { id, status } = req.query;
        await ProvidersPairFee.findOneAndUpdate({ _id: id }, { status: status }, { new: true }).then((status) => {
            if (status) {
                let msg = '';
                if (status.status === true) {
                    msg = 'enable';
                } else if (status.status === false) {
                    msg = 'disable';
                }
                res.status(200).json({ success: true, msg: `${status.pairName} is now ${msg}` });
            }
        }).catch((error) => {
            console.log(error)
            res.status(200).json({ success: false, msg: 'Something went wrong!' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!' });
    }
};










/*
Buy Crypto Amount
*/
let buyCryptoTrade = async (req, res, next) => {
    let { id } = req.user;
    let { euroAmount, cryptoQuantity, currencyId, symbol, cryptoCurrencyBuyPrice, pair } = req.body;
    let buyFromProvider: any;
    let buyFromAdmin = 0
    let adminBalance = 0;
    try {
        await AllowTradeByAdmin.findOne({ pairName: pair, tradeType: 'Buy' }).populate('pairId').then(async (allowProvider) => {
            if (allowProvider) {
                await Wallets.findOne({ currencyId: currencyId, symbol: symbol, walletType: 'admin' }).then(async (adminWallet) => {
                    if (adminWallet) {
                        adminBalance = adminWallet.balance;
                        if (cryptoQuantity >= adminBalance) {
                            buyFromAdmin = adminBalance;
                            buyFromProvider = cryptoQuantity - adminBalance;
                        } else {
                            buyFromAdmin = cryptoQuantity;
                            buyFromProvider = 0;
                        }
                        if (allowProvider.admin === true && allowProvider.exmo === true) {
                            if (allowProvider.pairId) {
                                let buyFromAdminFee = buyFromAdmin * allowProvider.pairId.adminBuyFee / 100;
                                let buyFromProviderFee = buyFromProvider * allowProvider.pairId.exmoBuyFee / 100;
                                await userFiatBalance(id).then(async (userEuroBalance) => {
                                    let buyEuroAmountAdminFee = parseFloat(euroAmount) + buyFromAdminFee * cryptoCurrencyBuyPrice;
                                    let buyEuroAmountProviderFee = parseFloat(euroAmount) + buyFromProviderFee * cryptoCurrencyBuyPrice;
                                    let totalAmountWithFee = buyEuroAmountAdminFee + buyEuroAmountProviderFee;
                                    if (totalAmountWithFee > userEuroBalance) {
                                        res.status(200).json({ success: false, msg: 'Your Euro balance is insufficent!', type: "amount is greater then the balance" });
                                    } else {
                                        await buyFromOnlyAdmin(id, buyEuroAmountAdminFee, currencyId, symbol, cryptoCurrencyBuyPrice, pair, buyFromAdmin, buyFromAdminFee).then(async (resultAdmin: any) => {
                                            if (buyEuroAmountProviderFee > 0) {
                                                await buyFromOnlyLiquidityProvider(id, buyEuroAmountProviderFee, cryptoQuantity, currencyId, symbol, cryptoCurrencyBuyPrice, pair, buyFromProvider, buyEuroAmountProviderFee).then((resultProvider: any) => {
                                                    if (resultAdmin.success === true && resultProvider.success === true) {
                                                        res.status(200).json({ success: true, msg: buyFromAdmin + buyFromProvider + ' added to your ' + symbol + ' wallet!' });
                                                    }
                                                }).catch((error) => {
                                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in only from provider' });
                                                });
                                            } else {
                                                res.status(200).json(resultAdmin);
                                            }
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in only from provider' });
                                        });
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
                                });
                            }
                        } else if (allowProvider.admin === true) {
                            if (allowProvider.pairId) {
                                let buyFromAdminFee = buyFromAdmin * allowProvider.pairId.adminBuyFee / 100;
                                await userFiatBalance(id).then(async (userEuroBalance) => {
                                    let buyEuroAmount = parseFloat(euroAmount) + buyFromAdminFee * cryptoCurrencyBuyPrice;
                                    if (buyEuroAmount > userEuroBalance) {
                                        res.status(200).json({ success: false, msg: 'Your Euro balance is insufficent!', type: "amount is greater then the balance" });
                                    } else {
                                        await buyFromOnlyAdmin(id, buyEuroAmount, currencyId, symbol, cryptoCurrencyBuyPrice, pair, cryptoQuantity, buyFromAdminFee).then((result) => {
                                            if (result) {
                                                res.status(200).json(result);
                                            }
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in only from admin' });
                                        });
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
                                });
                            }
                        } else if (allowProvider.exmo === true) {
                            if (allowProvider.pairId) {
                                let buyFromProviderFee = buyFromProvider * allowProvider.pairId.exmoBuyFee / 100;
                                await userFiatBalance(id).then(async (userEuroBalance) => {
                                    let buyEuroAmount = parseFloat(euroAmount) + buyFromProviderFee * cryptoCurrencyBuyPrice;
                                    if (buyEuroAmount > userEuroBalance) {
                                        res.status(200).json({ success: false, msg: 'Your Euro balance is insufficent!', type: "amount is greater then the balance" });
                                    } else {
                                        await buyFromOnlyLiquidityProvider(id, buyEuroAmount, cryptoQuantity, currencyId, symbol, cryptoCurrencyBuyPrice, pair, buyFromProvider, buyFromProviderFee).then((result) => {
                                            res.status(200).json(result);
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in only from provider' });
                                        });
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
                                });
                            }
                        }
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'catch' });
                });
            } else {
                res.status(200).json({ success: false, msg: 'Trade is currenctly down!', type: 'no buy provider' });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Error in Fetching buy allow provider!', type: 'catch' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'main catch' });
    }
};





/**
 * buy only from admin
 * @param req 
 * @param res 
 * @param buyFromAdmin 
 */
let buyFromOnlyAdmin = async (id, euroAmount, currencyId, symbol, cryptoCurrencyBuyPrice, pair, buyFromAdmin, fee) => {
    return new Promise(async (resolve, reject) => {
        try {
            let deductCryptoFromAdmin = new Trade({
                userId: id,
                cryptoAmount: buyFromAdmin,
                cryptoType: symbol,
                txFee: fee,
                cryptoCurrentPrice: cryptoCurrencyBuyPrice,
                euroAmount: euroAmount,
                type: 'credit',
                status: "completed"
            });
            deductCryptoFromAdmin.save((err, info) => {
                if (err) {
                    reject
                } else {
                    let newFiatTransaction = new FiatTransactions({
                        userId: id,
                        amount: -euroAmount,
                        currency: "EUR",
                        paymentmethod: pair,
                        tradeId: info._id,
                        type: 'debit',
                        status: 'completed',
                        txType: 'buy',
                    });
                    newFiatTransaction.save(async (err, fiatInfo) => {
                        if (err) {
                            reject(err);
                        } else {
                            await userCryptoTradeBalance(id, symbol).then(async (userCryptoBalance) => {
                                if (userCryptoBalance) {
                                    await TradeWallet.findOneAndUpdate({ userId: id, currencyId: currencyId }, { balance: userCryptoBalance }, { new: true }).then(async (result) => {
                                        ioSocketss.emit(`sendReceiveTrade_${id}`, { transaction: result, balance: userCryptoBalance });
                                        await userFiatBalance(id).then(async (balance) => {
                                            await FiatWallet.findOneAndUpdate({ userId: id, symbol: 'EUR' }, { balance: balance }, { new: true }).then((result) => {
                                                if (result) {
                                                    ioSocketss.emit(`fiatTransaction_${id}`, { transaction: result, balance: balance });
                                                    resolve({ success: true, msg: `${buyFromAdmin} added to your trade ${symbol} wallet!` })
                                                }
                                            }).catch((error) => {
                                                // console.log(error)
                                                reject({ success: false, msg: 'Something went wrong!', type: 'fiat update catch' });
                                            });
                                        }).catch((error) => {
                                            // console.log(error)
                                            reject({ success: false, msg: 'Something went wrong!', type: 'fiat find catch' });
                                        });
                                    }).catch((error) => {
                                        // console.log(error);
                                        reject({ success: false, msg: 'Something went wrong!', type: 'trade update catch' });
                                    });
                                }
                            }).catch((error) => {
                                reject({ success: false, msg: 'Something went wrong!', type: 'trade find catch' });
                            });
                        }
                    });
                }
            });
        } catch (error) {
            // console.log(error);
            reject({ success: false, msg: 'Something went wrong!', type: 'main catch' });
        }
    });
};



/**
 * buy only from liquidty provider
 * @param req 
 * @param res 
 * @param next 
 */
let buyFromOnlyLiquidityProvider = async (id, euroAmount, cryptoQuantity, currencyId, symbol, cryptoCurrencyBuyPrice, pair, buyFromProvider, fee) => {
    return new Promise(async (resolve, reject) => {
        try {
            await sendOrderToExmo(id, euroAmount, cryptoCurrencyBuyPrice, buyFromProvider, pair, 'market_buy', 0, symbol, fee).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};





/**
 * sell crypto amount
 */
let sellCryptoTrade = async (req, res, next) => {
    try {
        let { id } = req.user;
        let { cryptoAmount, euroQuantity, cryptoToEuroPrice, symbol, pair, currencyId } = req.body;
        AllowTradeByAdmin.findOne({ pairName: pair, tradeType: 'Sell' }).populate('pairId').then(async (allowProvider) => {
            if (allowProvider) {
                let sellToAdmin: any;
                let sellToProvider: any;
                await FiatWallet.findOne({ walletType: "admin", symbol: 'EUR' }).then(async (adminFiatWallet) => {
                    if (euroQuantity >= adminFiatWallet.balance) {
                        sellToAdmin = adminFiatWallet.balance;
                        sellToProvider = euroQuantity - adminFiatWallet.balance;
                    } else {
                        sellToAdmin = euroQuantity;
                        sellToProvider = 0;
                    }
                    if (allowProvider.admin === true && allowProvider.exmo === true) {
                        let amountToAdmin = sellToAdmin / cryptoToEuroPrice;
                        let amountToProvider = sellToProvider / cryptoToEuroPrice;
                        if (allowProvider.pairId) {
                            let feeOnAdminAmount = amountToAdmin * allowProvider.pairId.adminSellFee / 100;
                            let feeOnProvidersAmount = amountToProvider * allowProvider.pairId.exmoSellFee / 100;
                            let sellAdminAmountWithFee = feeOnAdminAmount + amountToAdmin;
                            let sellProviderAmountWithFee = feeOnProvidersAmount + amountToProvider;
                            let totalAmountWithFee = sellAdminAmountWithFee + sellProviderAmountWithFee;
                            await TradeWallet.findOne({userId: id, currencyId: currencyId}).then(async (userTradeWallet) => {
                                if (userTradeWallet) {
                                    if (totalAmountWithFee > userTradeWallet.balance) {
                                        res.status(200).json({ success: false, msg: `Your ${symbol} trade wallet balace is insufficent!`, type: 'low balance' });
                                    } else {
                                        await sellCryptoToAdminOnly(id, sellAdminAmountWithFee, symbol, cryptoToEuroPrice, sellToAdmin, currencyId, feeOnAdminAmount).then(async (result: any) => {
                                            if (sellProviderAmountWithFee > 0) {
                                                await sellToLiquidityProviderOnly(id, sellToProvider, symbol, cryptoToEuroPrice, pair, sellProviderAmountWithFee, feeOnProvidersAmount).then((sellOnExmo: any) => {
                                                    if (sellOnExmo.success === true && result.success === true) {
                                                        res.status(200).json({ success: true, msg: sellToAdmin + sellToProvider + ' added to your fiat wallet!' });
                                                    }
                                                }).catch((error) => {
                                                    res.status(200).json({ success: false, msg: 'Error in sell crypto to exmo!', type: "Trade wallet" });
                                                });
                                            } else {
                                                res.status(200).json(result);
                                            }
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Error in sell crypto to admin!', type: "Trade wallet" });
                                        });
                                    }
                                }
                            }).catch((error) => {
                                res.status(200).json({success: false, msg: 'Error in fetching user balance', type: 'user trade wallet'});
                            });
                        }
                    } else if (allowProvider.exmo === true) {
                        if (allowProvider.pairId) {
                            let providerSellFee = cryptoAmount * allowProvider.pairId.exmoSellFee / 100;
                            let sellAmountWithFee = parseFloat(cryptoAmount) + providerSellFee;
                            TradeWallet.findOne({ userId: id, currencyId: currencyId }).then(async (userCurrencyWallet) => {
                                if (userCurrencyWallet) {
                                    if (sellAmountWithFee > userCurrencyWallet.balance) {
                                        res.status(200).json({ success: false, msg: `Your ${symbol} trade wallet balace is insufficent!`, type: 'low balance' });
                                    } else {
                                        await sellToLiquidityProviderOnly(id, euroQuantity, symbol, cryptoToEuroPrice, pair, sellAmountWithFee, providerSellFee).then((sellOnExmo) => {
                                            res.status(200).json(sellOnExmo);
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Error in sell crypto to exmo!', type: "Trade wallet" });
                                        });
                                    }
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: 'Error in fetching trade wallet!', type: "Trade wallet" });
                            });
                        }
                    } else if (allowProvider.admin === true) {
                        if (allowProvider.pairId) {
                            let adminSellFee = cryptoAmount * allowProvider.pairId.adminSellFee / 100;
                            let sellAmountWithFee = parseFloat(cryptoAmount) + adminSellFee;
                            TradeWallet.findOne({ userId: id, currencyId: currencyId }).then(async (userCurrencyWallet) => {
                                if (userCurrencyWallet) {
                                    if (sellAmountWithFee > userCurrencyWallet.balance) {
                                        res.status(200).json({ success: false, msg: `Your ${symbol} trade wallet balace is insufficent!`, type: 'low balance' });
                                    } else {
                                        await sellCryptoToAdminOnly(id, sellAmountWithFee, symbol, cryptoToEuroPrice, euroQuantity, currencyId, adminSellFee).then((result) => {
                                            res.status(200).json(result);
                                        }).catch((error) => {
                                            res.status(200).json({ success: false, msg: 'Error in sell crypto to admin!', type: "Trade wallet" });
                                        });
                                    }
                                }
                            }).catch((error) => {
                                res.status(200).json({ success: false, msg: 'Error in fetching trade wallet!', type: "Trade wallet" });
                            });
                        }
                    }

                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Error in fetching trade wallet!', type: "Trade wallet" });
                });
            } else {
                res.status(200).json({ success: false, msg: 'Trade is currently down!', type: 'providers avialable' })
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Error in fetching provider!', type: "provider" });
        });
    } catch (error) {
        console.log(error);
    }
};


/**
 * sell crypto admin when only admin is avaliable
 * @param userId 
 * @param cryptoAmount 
 * @param symbol 
 * @param cryptoToEuroPrice 
 * @param euroQuantity 
 * @param currencyId 
 */
let sellCryptoToAdminOnly = async (userId, cryptoAmount, symbol, cryptoToEuroPrice, euroQuantity, currencyId, fee) => {
    return new Promise(async (resolve, reject) => {
        let newTrade = new Trade({
            userId: userId,
            cryptoAmount: -cryptoAmount,
            cryptoType: symbol,
            cryptoCurrentPrice: cryptoToEuroPrice,
            euroAmount: euroQuantity,
            type: 'debit',
            status: "completed",
            txFee: fee
        });
        newTrade.save((err, tradeResult) => {
            if (err) {
                reject({ success: false, msg: 'Error in saving trade trx!', type: "Trade wallet" });
            } else {
                let AddEuroToUserFiatWallet = new FiatTransactions({
                    userId: userId,
                    tradeId: tradeResult._id,
                    cryptoAmount: cryptoAmount,
                    currency: 'EUR',
                    cryptoCurrentPrice: cryptoToEuroPrice,
                    amount: euroQuantity,
                    type: 'credit',
                    status: "completed",
                    txType: 'sell',
                });
                AddEuroToUserFiatWallet.save(async (err, fiatSave) => {
                    if (err) {
                        reject({ success: false, msg: 'Error in credting fiat wallet!', type: "Fiat wallet" })
                    } else {
                        await userCryptoTradeBalance(userId, symbol).then(async (userCryptoBalance) => {
                            if (userCryptoBalance) {
                                await TradeWallet.findOneAndUpdate({ userId: userId, currencyId: currencyId }, { balance: userCryptoBalance }, { new: true }).then(async (result) => {
                                    ioSocketss.emit(`sendReceiveTrade_${userId}`, { symbol: symbol, transaction: result, balance: userCryptoBalance });
                                    await userFiatBalance(userId).then(async (balance) => {
                                        await FiatWallet.findOneAndUpdate({ userId: userId, symbol: 'EUR' }, { balance: balance }, { new: true }).then((result) => {
                                            if (result) {
                                                ioSocketss.emit(`fiatTransaction_${userId}`, { transaction: result, balance: balance });
                                                resolve({ success: true, msg: `${euroQuantity} added to your fiat wallet!` });
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
    });
};



/**
 * sell order on exmo
 * @param id 
 * @param euroAmount 
 * @param symbol 
 * @param cryptoCurrencySellPrice 
 * @param pair 
 * @param sellOnProvider 
 */
let sellToLiquidityProviderOnly = async (id, euroAmount, symbol, cryptoCurrencySellPrice, pair, sellOnProvider, fee) => {
    return new Promise(async (resolve, reject) => {
        try {
            await sendOrderToExmo(id, euroAmount, cryptoCurrencySellPrice, sellOnProvider, pair, 'market_sell', 1, symbol, fee).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};



export {
    buyCryptoTrade,
    sellCryptoTrade,
    activateLiquidityProvider,
    activatedProvider,
    changeProviderStatus,
    saveProvidersPairFee,
    getAllPairsProvidersFee,
    uniquePairDetails,
    updateProvidersPairFee,
    updatePairStatus
}
