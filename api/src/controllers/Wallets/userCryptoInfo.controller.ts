import { Wallets } from "../../db/models/Wallets/wallet.model";
import { User } from "../../db/models/users/users.model";
import { SendReceiveTrx } from "../../db/models/Wallets/sendReceiveTransaction.model";
import { UserProfile } from "../../db/models/users/userProfile.model";
import { getAllActiveCurrency, getTradeActiveCurrency } from "../admin/Admin-Users/currency.controller";
import { TradeWallet } from "../../db/models/Wallets/trade.wallet.model";
import * as mongoose from "mongoose";
import { userCryptoTradeBalance } from "../../services/WalletService/trade.service";
import { Trade } from "../../db/models/Wallets/trade.model";
import { mailer } from "../../services/UserService/mail.service";
import { sender } from "../../config/config";
import { EmailTemplate } from "../../db/models/emailTemplate/emailTemplate.model";



/**
 * sending mail for getting code on email
 */
let sendEmailCode = async (req, res, next) => {
    try {
        let { id } = req.user;
        let { withdrawAmount, coinType } = req.body;
        let min = Math.ceil(100000);
        let max = Math.floor(999999);
        let randomNumber = Math.floor(Math.random() * (max - min)) + min;
        await userCryptoTradeBalance(id, coinType).then(async (userBalance) => {
            if (withdrawAmount > userBalance) {
                res.status(200).json({ success: false, msg: `Your trade balance of ${coinType} is insufficent!`, type: 'get code' });
            } else {
                await UserProfile.findOneAndUpdate({ userId: id }, { smscode: randomNumber }, { new: true }).then(async (userProfile) => {
                    if (userProfile) {
                        await User.findById(id, { password: 0 }).populate('userProfileId').then(async (user) => {
                            if (user) {
                                let mailOptions;
                                await EmailTemplate.findOne({ mailType: 'send-withdraw-code' }).then((sendCode) => {
                                    if (sendCode) {
                                        let emailHTML;
                                        let emailSubject;
                                        if (user.language === 'fa') {
                                            emailHTML = sendCode.emailBodyFarsi;
                                            emailSubject = sendCode.subjectFarsi;
                                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                            emailHTML = emailHTML.replace("{crypto_amount}", withdrawAmount);
                                            emailHTML = emailHTML.replace("{crypto_type}", coinType);
                                            emailHTML = emailHTML.replace("{verification_code}", randomNumber)
                                            mailOptions = {
                                                from: sender, // sender address
                                                to: user.email, // list of receivers
                                                subject: emailSubject, // Subject line
                                                html: emailHTML // html body
                                            };
                                        } else {
                                            emailHTML = sendCode.emailBody;
                                            emailSubject = sendCode.subject;
                                            emailHTML = emailHTML.replace("{user_firstname}", user.firstname);
                                            emailHTML = emailHTML.replace("{crypto_amount}", withdrawAmount);
                                            emailHTML = emailHTML.replace("{crypto_type}", coinType);
                                            emailHTML = emailHTML.replace("{verification_code}", randomNumber)
                                            mailOptions = {
                                                from: sender, // sender address
                                                to: user.email, // list of receivers
                                                subject: emailSubject, // Subject line
                                                html: emailHTML // html body
                                            };
                                        }
                                        mailer(mailOptions);
                                        res.status(200).json({ success: true, msg: 'Please check your email address. We have send a code on it.', type: 'get code' });
                                    }
                                }).catch((error) => {
                                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'email template catch', error: error });
                                });
                            }
                        }).catch((error) => {
                            res.status(200).json({ success: false, msg: 'Something went wrong. Please try later!', type: 'get code' });
                        });
                    } else {
                        res.status(200).json({ success: false, msg: 'Something went wrong. Please try later!', type: 'get code' });
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: 'Something went wrong. Please try later!', type: 'get code' });
                });
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: `${error} Something went wrong. Please try later!`, type: 'get code' });
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: 'Something went wrong. Please try later!', type: 'get code' });
    }
};






let sendReceiveAllTrx = async (req, res, next) => {
    try {
        if (req.query.search == '' || req.query.search == 'undefined') {
            let { page, perpage } = req.query;
            let pgNo = Number(page);//|| 1;
            let recordPerPage = Number(perpage);// || 4;
            let skip = (pgNo - 1) * recordPerPage;
            let trx = await SendReceiveTrx.find({ userId: req.user.id }).skip(skip).limit(recordPerPage).sort({ timestamp: -1 });
            let count = await SendReceiveTrx.find({ userId: req.user.id }).countDocuments();
            res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
        } else {
            var search = req.query.search;
            let { page, perpage } = req.query;
            let pgNo = Number(page);//|| 1;
            let recordPerPage = Number(perpage);// || 4;
            let skip = (pgNo - 1) * recordPerPage;
            let filter = { userId: req.user.id, $or: [{ receiverAddress: { $regex: search } }, { txId: { $regex: search } }, { currencyType: { $regex: search } }, { type: { $regex: search } }] };
            let trx = await SendReceiveTrx.find(filter).skip(skip).limit(recordPerPage).sort({ timestamp: -1 });
            let count = await SendReceiveTrx.find({ userId: req.user.id }).countDocuments();
            res.status(200).json({ transactions: trx, count: count, status: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
        }
    } catch (error) {
        // console.log(error)
        res.status(500).json({ status: false, message: 'Internal Server Error' });
        console.log(error);
    }
}




/**
 * 
 * @param req 
 * @param res 
 * @param next 
 */
let genrateWalletForUser = async (req, res, next) => {
    try {
        let { id } = req.user;

        await getAllActiveCurrency().then(async (currency: any) => {
            let count = 0;
            let currencyLength = currency.length;
            for (let i = 0; i < currency.length; i++) {
                const currencyElement = currency[i];
                let newwallet = new Wallets({});
                await Wallets.findOne({ userId: id, symbol: currencyElement.symbol }).then((wallet) => {
                    count++;
                    if (wallet !== null && wallet !== undefined && wallet !== {} && wallet !== []) {
                    } else {
                        if (currencyElement.type === 'crypto') {
                            newwallet.userId = id;
                            newwallet.title = currencyElement.title;
                            newwallet.currencyId = currencyElement._id
                            newwallet.symbol = currencyElement.symbol;
                            newwallet.logo = currencyElement.logo;
                            newwallet.type = currencyElement.type;
                            newwallet.walletType = 'user';
                        } else if (currencyElement.type === 'erc20') {
                            newwallet.userId = id;
                            newwallet.title = currencyElement.title;
                            newwallet.currencyId = currencyElement._id;
                            newwallet.symbol = currencyElement.symbol;
                            newwallet.logo = currencyElement.logo;
                            newwallet.contractAddress = currencyElement.contractAddress;
                            newwallet.type = currencyElement.type;
                            newwallet.walletType = 'user';
                        }
                        newwallet.save((err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                genrateTradeWallet(req, res, next, result._id, result.userId, result.currencyId);
                            }
                        });
                    }
                }).catch((error) => {
                    console.log(error);
                });
            }
            if (count === currencyLength) {
                res.json({ msg: 'Already' });
            }
        }).catch((error) => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
};



// getting the send and receive transaction of crypto from our database to display on the front-end
let sendReciveCryptoTnxUser = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search, symbol } = req.query;
        let pgNo = Number(pageIndex);//|| 1;
        let recordPerPage = Number(pageSize);// || 4;
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = { userId: req.user.id, currencyType: symbol };
        } else {
            filter = { userId: req.user.id, currencyType: symbol, $or: [{ receiverAddress: { $regex: search } }, { txId: { $regex: search } }, { currencyType: { $regex: search } }, { type: { $regex: search } }] };
        }
        let trx = await SendReceiveTrx.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await SendReceiveTrx.find({ userId: req.user.id, currencyType: symbol }).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error)
    }
};


// getting the send and receive transaction of trade crypto from our database to display on the front-end
let sendReciveTradeTnxUser = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search, symbol } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = { userId: req.user.id, cryptoType: symbol };
        } else {
            filter = { userId: req.user.id, cryptoType: symbol, $or: [{ cryptoAmount: { $regex: search } }, { txId: { $regex: search } }, { cryptoType: { $regex: search } }, { status: { $regex: search } }] };
        }
        let trx = await Trade.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await Trade.find({ userId: req.user.id, cryptoType: symbol }).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error)
    }
};




/**
 * getting all wallet for displaying to the admin
 * @param req 
 * @param res 
 * @param next 
 */
let getUserWallet = async (req, res, next) => {
    try {
        await Wallets.find({ userId: req.user.id }, { account_index: 0, account_name: 0, password: 0, secret: 0 }).populate('currencyId').then((wallet) => {
            res.status(200).json(wallet);
        }).catch((error) => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
};


/**
 * 
 * @param req 
 * @param res 
 * @param next 
 * @param walletId 
 * @param userId 
 * @param currencyId 
 */
let activateUserToken = async (req, res, next) => {
    let { id } = req.user;
    try {
        await Wallets.findOne({ userId: id, symbol: 'ETH', status: true }).then(async (wallet) => {
            if (wallet) {
                await Wallets.updateMany({ userId: id, type: 'erc20', walletType: "user" }, { $set: { account_name: wallet.account_name, address: wallet.address, password: wallet.password, status: true } }).then((tokenStatus) => {
                    if (tokenStatus) {
                        res.status(200).json(tokenStatus)
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error })
                });
            } else {
                res.json({ msg: "no eth" })
            }
        }).catch((error) => {
            res.status(200).json({ success: false, msg: error })
        });
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, msg: error })
    }
};




/**
 * 
 * @param req 
 * @param res 
 * @param next 
 */
let genrateTradeWallet = async (req, res, next, walletId, userId, currencyId) => {
    try {
        let { id } = req.user;
        await getTradeActiveCurrency(currencyId).then(async (currency: any) => {
            currency.forEach(async (element) => {
                let newTrade = new TradeWallet({
                    userId: userId,
                    walletId: walletId,
                    walletType: 'user',
                    title: element.title,
                    currencyId: element._id,
                    symbol: element.symbol,
                    logo: element.logo,
                    type: element.type,
                    contractAddress: element.contractAddress
                });
                newTrade.save((err, result) => {
                    if (err) {
                        console.log(err);
                    } else {

                    }
                });
            });
        }).catch((error) => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
};




/**
 * getting all wallet for displaying to the user
 * @param req 
 * @param res 
 * @param next 
 */
let getUserTradeWallet = async (req, res, next) => {
    try {
        let userId = mongoose.Types.ObjectId(req.user.id);

        await Wallets.aggregate([
            {
                $match: {
                    userId: userId
                }
            },
            {
                $lookup:
                {
                    from: "tradewallets",
                    localField: "_id",
                    foreignField: "walletId",
                    as: "tradeWallets"
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
                $unwind: '$tradeWallets'
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





export {
    sendEmailCode,
    sendReceiveAllTrx,
    genrateWalletForUser,
    getUserWallet,
    genrateTradeWallet,
    getUserTradeWallet,
    activateUserToken,
    sendReciveCryptoTnxUser,
    sendReciveTradeTnxUser
}