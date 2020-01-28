import * as request from 'request';
import { merchantId } from '../../config/config';
import * as geoip from 'geoip-lite';
import { UserProfile } from '../../db/models/users/userProfile.model';
import { FiatTransactions } from '../../db/models/Wallets/fiat.transactions.model';
import { getAllActiveFiatCurrency } from '../admin/Admin-Users/currency.controller';
import { FiatWallet } from '../../db/models/Wallets/fiat.wallet.model';
import * as mongoose from "mongoose";



// let callback = 'https://localhost:3000/userWallets/updateTransaction';



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


/**
 * genrating euro wallet for user
 * @param req 
 * @param res 
 * @param next 
 */
let userFiatCurrencyWallet = async (req, res, next) => {
    try {
        let { id } = req.user;
        await getAllActiveFiatCurrency().then(async (fiatCurrency: any) => {
            let count = 0;
            let currencyLength = fiatCurrency.length;
            for (let i = 0; i < currencyLength; i++) {
                const fiatElement = fiatCurrency[i];
                let newWallet = new FiatWallet();
                await FiatWallet.findOne({ symbol: fiatElement.symbol, userId: id, walletType: 'user' }).then((fiatWallet) => {
                    count++;
                    if (fiatWallet !== null && fiatWallet !== undefined && fiatWallet !== {} && fiatWallet !== []) {
                    } else {
                        if (fiatElement.type === 'fiat') {
                            newWallet.userId = id;
                            newWallet.title = fiatElement.title;
                            newWallet.currencyId = fiatElement._id
                            newWallet.symbol = fiatElement.symbol;
                            newWallet.logo = fiatElement.logo;
                            newWallet.type = fiatElement.type;
                            newWallet.walletType = 'user';
                        }
                        newWallet.save((error, result) => {
                            if (error) {
                                res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
                            } else {
                                // res.json({ msg: 'already' });
                            }
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
                });
            }
            if (count === currencyLength) {
                res.json({ msg: 'Fiat Already' });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
    }
};




/**
 * genrating euro wallet for admin
 * @param req 
 * @param res 
 * @param next 
 */
let adminFiatCurrencyWallet = async (req, res, next) => {
    try {
        let { id } = req.admin;
        await getAllActiveFiatCurrency().then(async (fiatCurrency: any) => {
            let count = 0;
            let currencyLength = fiatCurrency.length;
            for (let i = 0; i < currencyLength; i++) {
                const fiatElement = fiatCurrency[i];
                let newWallet = new FiatWallet();
                await FiatWallet.findOne({ symbol: fiatElement.symbol, adminId: id, walletType: 'admin' }).then((fiatWallet) => {
                    count++;
                    if (fiatWallet !== null && fiatWallet !== undefined && fiatWallet !== {} && fiatWallet !== []) {
                    } else {
                        if (fiatElement.type === 'fiat') {
                            newWallet.adminId = id;
                            newWallet.title = fiatElement.title;
                            newWallet.currencyId = fiatElement._id
                            newWallet.symbol = fiatElement.symbol;
                            newWallet.logo = fiatElement.logo;
                            newWallet.type = fiatElement.type;
                            newWallet.walletType = 'admin';
                        }
                        newWallet.save((error, result) => {
                            if (error) {
                                res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
                            } else {
                                // res.json({ msg: 'already' });
                            }
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
                });
            }
            if (count === currencyLength) {
                res.json({ msg: 'Fiat Already' });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: "Error in fetching Fiat wallet" })
    }
};



/**
 * getting all fiat wallet for displaying to the user
 * @param req 
 * @param res 
 * @param next 
 */
let getUserFiatWallet = async (req, res, next) => {
    try {
        let userId = mongoose.Types.ObjectId(req.user.id);

        await FiatWallet.aggregate([
            {
                $match: {
                    userId: userId
                }
            },
            {
                $lookup:
                {
                    from: "currencies",
                    localField: "currencyId",
                    foreignField: "_id",
                    as: "currency"
                }
            },
            {
                $unwind: '$currency'
            }

        ]).then((wallets) => {
            res.status(200).json(wallets);
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in ' });
        });
    } catch (error) {
        console.log(error);
    }
};





/**
 * getting all fiat wallet for displaying to the admin
 * @param req 
 * @param res 
 * @param next 
 */
let getAdminFiatWallet = async (req, res, next) => {
    try {
        let adminId = mongoose.Types.ObjectId(req.admin.id);

        await FiatWallet.aggregate([
            {
                $match: {
                    adminId: adminId
                }
            },
            {
                $lookup:
                {
                    from: "currencies",
                    localField: "currencyId",
                    foreignField: "_id",
                    as: "currency"
                }
            },
            {
                $unwind: '$currency'
            }

        ]).then((wallets) => {
            res.status(200).json(wallets);
        }).catch((error) => {
            res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in ' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in ' });
    }
};



/**
 * getting exchange rate of euro to other fiat currencies
 */
let getYekpayExchangeRate = async (req, res, next) => {
    try {
        let { fromCurrency, toCurrency } = req.body;
        let arg = {
            merchantId: merchantId.merchantId,
            fromCurrencyCode: fromCurrency,
            toCurrencyCode: toCurrency,
        };
        let args = JSON.stringify(arg);

        let options = {
            method: "POST",
            url: "https://gate.yekpay.com/api/payment/exchange",
            headers: {
                "Content-Type": "application/json"
            },
            body: args
        };
        request(options, (error, response, body) => {
            if (error) {
                res.status(200).json({ success: false, msg: 'Unable to fetch exchange rate!', type: 'error in exchange rate' });
            } else {
                let getData = JSON.parse(body);
                res.status(200).json({ success: true, rate: getData.Rate_up, rate_lower: getData.Rate, body: body });
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'Error in ' });
    }
};



// credit euro amount in user euro wallet
let creditEuroAmount = async (req, res, next) => {
    try {
        let { cardNo, currency, currencyRate, fromCurrency, toCurrency, currencyCode, currencyId, currentprice, fixedprice, rialAccountStatus, quantity, paymentmethod, symbol } = req.body;
        let commission = fixedprice * 0.039;
        let fixedPrice = parseFloat(fixedprice) + commission;
        let geo = geoip.lookup('5.159.248.0');
        let args;
        if (currencyCode) {
            await UserProfile.findOne({ userId: req.user.id }).populate("userId").then((user) => {
                if (user.step < 4) {
                    res.status(200).json({ success: false, msg: 'Please complete your KYC first!', type: 'step is not 4' });
                } else {
                    if (user.address_verification === 'pending' || user.doc_verification === 'pending' || user.doc_verification_back === 'pending' || user.selfie_verification === 'pending') {
                        res.status(200).json({ success: false, msg: 'Your KYC is not verified yet!', type: 'not verified' });
                    } else {
                        if (user.address_verification === 'rejected' || user.doc_verification === 'rejected' || user.doc_verification_back === 'rejected' || user.selfie_verification === 'rejected') {
                            res.status(200).json({ success: false, msg: 'Your KYC is reject by admin. Please complete your KYC!', type: 'not verified' });
                        } else {
                            if (currency === "IRR") {
                                var accountNo = accountNo;
                                args = {
                                    merchantId: '2KRSNVRT569AFZ5M5QR456M8NJ6FUFB6',
                                    amount: Math.round(fixedPrice * currencyRate),
                                    fromCurrencyCode: fromCurrency,
                                    toCurrencyCode: toCurrency,
                                    orderNumber: Date.now(),
                                    callback: `${req.headers.origin}/orderStatus`,
                                    firstName: user.userId.firstname,
                                    lastName: user.userId.lastname,
                                    email: user.userId.email,
                                    mobile: user.userId.mobile,
                                    address: user.address,
                                    country: user.country,
                                    postalCode: user.pincode,
                                    city: user.city,
                                    description: symbol,
                                    user_id: req.user.id,
                                    IBAN: accountNo,
                                    card_number: cardNo
                                };
                            } else {
                                args = {
                                    merchantId: '2KRSNVRT569AFZ5M5QR456M8NJ6FUFB6',
                                    amount: Math.round(fixedPrice * currencyRate),
                                    fromCurrencyCode: fromCurrency,
                                    toCurrencyCode: toCurrency,
                                    orderNumber: Date.now(),
                                    callback: `${req.headers.origin}/orderStatus`,
                                    firstName: user.userId.firstname,
                                    lastName: user.userId.lastname,
                                    email: user.userId.email,
                                    mobile: user.mobile,
                                    address: user.address,
                                    country: user.country,
                                    postalCode: user.pincode,
                                    city: user.city,
                                    description: symbol
                                };
                            }

                            args = JSON.stringify(args);

                            var options = {
                                method: "POST",
                                url: "https://gate.yekpay.com/api/payment/request",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: args
                            };
                            request(options, (error, response, body) => {
                                let saveTransit = new FiatTransactions({
                                    userId: req.user.id,
                                    amount: quantity,
                                    currency: symbol,
                                    currencyId: currencyId,
                                    paymentmethod: paymentmethod,
                                    authority: JSON.parse(body).Authority,
                                    gatewayData: JSON.parse(body),
                                    euroRate: currencyRate,
                                    txType: "topup",
                                    type: 'credit',
                                    status: 'pending'
                                });

                                saveTransit.save(function (err) {
                                    if (err) {
                                        res.status(200).json({ success: false, msg: 'Error in saving fiat transaction!', type: 'save fiat' });
                                    } else {
                                        res.status(200).json({ success: true, data: JSON.parse(body) });
                                    }
                                });
                            });
                        }
                    }
                }
            });

        } else {
            res.json({ success: false, msg: 'Unauthorized' });
        }
    } catch (error) {
        res.status(200).json({ sucess: false, msg: error });
    }
};




let updateTransaction = async (req, res) => {
    try {
        let args = {
            merchantId: '2KRSNVRT569AFZ5M5QR456M8NJ6FUFB6',
            authority: req.query.authority
        }
        let options = {
            method: "POST",
            url: "https://gate.yekpay.com/api/payment/verify",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(args)
        };
        request(options, async function (error, response, body) {
            //   console.log(body);
            body = JSON.parse(body);
            if (body.Success == 1) {
                var data = '';
                await FiatTransactions.findOneAndUpdate({ 'authority': req.body.authority }, { status: 'completed' }).then(async (result) => {
                    if (result) {
                        await userFiatBalance(req.user.id).then(async (balance) => {
                            if (balance) {
                                await FiatWallet.findOneAndUpdate({ userId: req.user.id, symbol: 'EUR' }, { balance: balance }).then(async (result) => {
                                    if (result) {
                                        FiatTransactions.findOne({ type: 'credit', status: 'completed', 'authority': req.body.authority }).then(async (fiatTransaction) => {
                                            await FiatWallet.findOneAndUpdate({ symbol: 'EUR', walletType: 'admin' }, { $inc: { balance: fiatTransaction.amount} }).then(async (adminWallet) => {
                                                res.status(200).json({ redirectPage: `${req.headers.origin}/paymentStatus?success=1` });
                                            }).catch((error) => {
                                                res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
                                            });
                                        }).catch((error) => {
                                            res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
                                        });
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
                                });
                            }
                        }).catch((error) => {
                            res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
                        });
                    }
                }).catch((error) => {
                    res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
                });
            } else {
                res.status(200).json({ data: body, redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
            }
        });
    } catch (error) {
        res.status(200).json({ redirectPage: `${req.headers.origin}/paymentStatus?success=0` });
    }
};






/**
 * user fiat balance
 */
let userFiatBalance = async (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let totalAmount = 0;
            await FiatTransactions.find({ userId: userId, status: 'completed', currency: 'EUR' }).then(async (userFiat) => {
                for (let i = 0; i < userFiat.length; i++) {
                    totalAmount = totalAmount + userFiat[i].amount;
                }
                resolve(totalAmount);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};





// getting the fiat transaction from our database to display on the front-end
let userFiatTransactions = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search, symbol } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = { userId: req.user.id, currency: symbol };
        } else {
            filter = { userId: req.user.id, currency: symbol, $or: [ {type: { $regex: search } }, { txType: { $regex: search } }, { paymentmethod: { $regex: search } }, { currency: { $regex: search } }, { status: { $regex: search } }] };
        }
        let trx = await FiatTransactions.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await FiatTransactions.find({ userId: req.user.id, currency: symbol }).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error)
    }
};






/**
 * withdraw euro from bank
 */
let bankTransferPayment = async (req, res, next) => {
    try {

    } catch (error) {
        res.status(200).json({ sucess: false, msg: error });
    }
};





export {
    getYekpayExchangeRate,
    creditEuroAmount,
    userFiatBalance,
    bankTransferPayment,
    userFiatCurrencyWallet,
    getUserFiatWallet,
    updateTransaction,
    adminFiatCurrencyWallet,
    getAdminFiatWallet,
    userFiatTransactions
}