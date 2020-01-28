import { Currency } from "../../../db/models/Wallets/currencies.model";
import { getToeknDetailsByContractAddress } from "../../../services/AdminService/token.service";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { ioSocketss } from "../../..";



let createCurrency = async (req, res, next) => {
    try {
        let { type, title, fee, feein, exchangeFee, exchangeFeein, tradeFee, tradeFeein, contractAddress, symbol, status } = req.body;
        let logo = '';
        if (req.file === undefined) {
            res.status(200).json({ success: false, msg: 'Please choose a image', type: 'user details' });
            return false;
        } else {
            logo = req.file.filename;
            let newCurrency = new Currency({});
            if (type === 'crypto') {
                await Currency.findOne({$or: [{ title: title }, { symbol: symbol }]}).then((currency) => {
                    if (currency) {
                        return res.status(200).json({ success: false, msg: `${title} is already exists!` })
                    } else {
                        newCurrency.type = type;
                        newCurrency.title = title;
                        newCurrency.fee = fee;
                        newCurrency.feein = feein;
                        newCurrency.exchangeFee = exchangeFee;
                        newCurrency.exchangeFeein = exchangeFeein;
                        newCurrency.tradeFee = tradeFee;
                        newCurrency.tradeFeein = tradeFeein;
                        newCurrency.logo = logo;
                        newCurrency.symbol = symbol;
                        newCurrency.status = status;
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!' });
                });
            } else if (type === 'fiat') {
                await Currency.findOne({$or: [{ title: title }, { symbol: symbol }]}).then((currency) => {
                    if (currency) {
                        return res.status(200).json({ success: false, msg: `${title} is already exists!` })
                    } else {
                        newCurrency.type = type;
                        newCurrency.title = title;
                        newCurrency.logo = logo;
                        newCurrency.symbol = symbol;
                        newCurrency.status = status;
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!' });
                });
            } else if (type === 'erc20') {
                await getToeknDetailsByContractAddress(contractAddress).then(async (res: any) => {
                    await Currency.findOne({$or: [{ title: title }, { symbol: symbol }]}).then((currency) => {
                        if (currency) {
                            return res.status(200).json({ success: false, msg: `${title} is already exists!` })
                        } else {
                            newCurrency.symbol = res.symbol;
                            newCurrency.type = type;
                            newCurrency.title = res.name;
                            newCurrency.logo = logo;
                            newCurrency.status = status;
                            newCurrency.fee = fee;
                            newCurrency.feein = feein;
                            newCurrency.exchangeFee = exchangeFee;
                            newCurrency.exchangeFeein = exchangeFeein;
                            newCurrency.tradeFee = tradeFee;
                            newCurrency.tradeFeein = tradeFeein;
                            newCurrency.contractAddress = res.contractAddress;
                        }
                    }).catch((error) => {
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'find currency' });
                    });
                }).catch((err) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'token details by contract address' });
                });
            }
            if (newCurrency.type) {
                newCurrency.save((err, result) => {
                    if (err) {
                        res.status(200).json({ success: false, msg: err, type: 'Error in creating currency' });
                    } else {
                        res.status(200).json({ success: true, msg: `${newCurrency.title} created successfully & now ${status}!` });
                        ioSocketss.emit(`newCurrencyCreation`, {symbol: newCurrency.symbol, currency: newCurrency});
                        ioSocketss.emit(`fetchNewCurrencyWallet`, {symbol: newCurrency.symbol, currency: newCurrency});
                    }
                });
            }
        }
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!' });
    }
};


let getAllCurrenciesAdmin = async (req, res, next) => {
    try {

        let filter = {};
        let { pageIndex, pageSize, search } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = {};
        } else {
            filter = { $or: [{ type: { $regex: search, } }, { title: { $regex: search } }, { symbol: { $regex: search } }, { status: { $regex: search } }] };
        }
        let currency = await Currency.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdAt: -1 });
        let count = await Currency.find(filter).countDocuments();
        res.status(200).json({ currency: currency, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error);
    }
};


let changeCurrencyStatus = async (req, res, next) => {
    try {
        let { id, status } = req.query;
        let currency = await Currency.findByIdAndUpdate(id, { status: status }, { new: true });
        if (currency) {
            res.status(200).json({ success: true, msg: `${currency.title} is now ${currency.status}!`, type: 'Currency active/inactive' });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in updation' });
        }
    } catch (error) {
        console.log(error);
    }
};


let changeCurrencyTradeStatus = async (req, res, next) => {
    try {
        let { id, tradeStatus } = req.query;
        let currency = await Currency.findByIdAndUpdate(id, { tradeStatus: tradeStatus }, { new: true });
        if (currency) {
            let TradeStatus = '';
            if (currency.tradeStatus === true) {
                TradeStatus = 'enable';
            } else if (currency.tradeStatus === false) {
                TradeStatus = 'disable';
            }
            res.status(200).json({ success: true, msg: `Trade is now ${TradeStatus} in ${currency.title} !`, type: 'Currency trade active/inactive' });
        } else {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in updation' });
        }
    } catch (error) {
        console.log(error);
    }
};



let changeCurrencyBuySellStatus = async (req, res, next) => {
    try {
        let { id, buySellStatus } = req.query;
        await Currency.findByIdAndUpdate(id, { buySellStatus: buySellStatus }, { new: true }).then((currency) => {
            if (currency) {
                let status = '';
                if (currency.buySellStatus === true) {
                    status = 'enable';
                } else if (currency.buySellStatus === false) {
                    status = 'disable';
                }
                res.status(200).json({ success: true, msg: `Buy & Sell is now ${status} in ${currency.title} !`, type: 'Currency buy/sell active/inactive' });
            } else {
                res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in updation' });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in updation' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'error in updation' });
    }
};







let getAllActiveCurrency = async () => {
    try {
        return new Promise(async (resolve, reject) => {
            await Currency.find({ type: { $ne: "fiat" }, status: 'Active' }).then((currency) => {
                resolve(currency);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });
        });
    } catch (error) {
        console.log(error);
    }
};



let getTradeActiveCurrency = async (currencyId) => {
    try {
        return new Promise(async (resolve, reject) => {
            await Currency.find({ _id: currencyId, type: 'crypto' }).then((currency) => {
                resolve(currency);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });
        });
    } catch (error) {
        console.log(error);
    }
};


let getAllActiveFiatCurrency = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            await Currency.find({ type: "fiat", status: 'Active' }).then((fiatCurrency) => {
                resolve(fiatCurrency);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};



let getAllActiveAndBuySellActiveCurrency = async () => {
    try {
        return new Promise(async (resolve, reject) => {
            await Currency.find({ type: { $ne: "fiat" }, status: 'Active', buySellStatus: true }).then((currency) => {
                resolve(currency);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });
        });
    } catch (error) {
        console.log(error);
    }
};







export {
    createCurrency,
    getAllCurrenciesAdmin,
    changeCurrencyStatus,
    changeCurrencyTradeStatus,
    getAllActiveCurrency,
    getTradeActiveCurrency,
    changeCurrencyBuySellStatus,
    getAllActiveFiatCurrency,
    getAllActiveAndBuySellActiveCurrency

}