import * as bcrypt from 'bcrypt';
import { Admin } from '../../../db/models/admin/admin.model';
import { comparePassword } from '../../../services/UserService/compare.password.service';
import { JWTSecret } from '../../../config/config';
import * as jwt from 'jsonwebtoken';
import { AdminTradeWallet } from "../../../db/models/Wallets/adminTrade.model";
import { Trade } from "../../../db/models/Wallets/trade.model";
import { AdminDetailsForTrade } from "../../../config/config";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { SendReceiveTrx } from '../../../db/models/Wallets/sendReceiveTransaction.model';
import { transferBTCAmount, getBTCBalance } from '../../../services/WalletService/btc.Service';
import { getAllActiveCurrency } from './currency.controller';


/**
 *  create every time a new admin credentials
 */
let adminRegister = async (req, res, next) => {
    try {
        let { fullName, email, password, firstname, lastname } = req.body;
        let salt = await bcrypt.genSaltSync(10);
        let hashPassword = await bcrypt.hashSync(password, salt);

        let newAdmin = new Admin({
            fullName: fullName,
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: hashPassword
        });

        newAdmin.save(newAdmin, (err, result) => {
            if (err) {
                res.status(200).json({ success: false, msg: 'Unable to create new admin!', type: 'new admin' })
            } else {
                res.status(200).json({ success: true, msg: 'New admin created successfully!', type: 'new admin' })
            }
        });
    } catch (error) {
        console.log(error);
    }
};



/**
 * login admin API
 */
let adminLogin = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        let admin = await Admin.findOne({ email: email });
        if (admin) {
            let isMatch = comparePassword(password, admin.password);
            if (isMatch) {
                jwt.sign({
                    id: admin._id,
                    firstname: admin.fullName,
                    email: admin.email,
                }, JWTSecret, { expiresIn: 60 * 60 * 12 }, async (err, token) => {
                    if (err) {
                        throw err;
                    } else {
                        res.status(200).json({ token, success: true, msg: 'Admin login Successfully', type: 'login' });
                    }
                });
            } else {
                res.status(200).json({ success: false, msg: 'Admin credentials is wrong!', type: 'Not found' });
            }
        } else {
            res.status(200).json({ success: false, msg: 'Admin credentials is wrong!', type: 'Not found' });
        }
    } catch (error) {
        console.log(error);
    }
};



/**
 * 
 * @param req 
 * @param res 
 * @param next 
 */
let genrateWallet = async (req, res, next) => {
    try {
        let { id } = req.admin;
        await getAllActiveCurrency().then(async (currency: any) => {
            let count = 0;
            let currencyLength = currency.length;
            for (let i = 0; i < currency.length; i++) {
                const currencyElement = currency[i];
                let newwallet = new Wallets({});
                await Wallets.findOne({ adminId: id, symbol: currencyElement.symbol }).then((wallet) => {
                    count++;
                    if (wallet !== null && wallet !== undefined && wallet !== {} && wallet !== []) {
                    } else {
                        if (currencyElement.type === 'crypto') {
                            newwallet.adminId = id;
                            newwallet.title = currencyElement.title;
                            newwallet.currencyId = currencyElement._id
                            newwallet.symbol = currencyElement.symbol;
                            newwallet.logo = currencyElement.logo;
                            newwallet.type = currencyElement.type;
                            newwallet.walletType = 'admin';
                        } else if (currencyElement.type === 'erc20') {
                            newwallet.adminId = id;
                            newwallet.title = currencyElement.title;
                            newwallet.currencyId = currencyElement._id;
                            newwallet.symbol = currencyElement.symbol;
                            newwallet.logo = currencyElement.logo;
                            newwallet.contractAddress = currencyElement.contractAddress;
                            newwallet.type = currencyElement.type;
                            newwallet.walletType = 'admin';
                        }
                        newwallet.save((err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                // genrateTradeWallet(req, res, next, result._id, result.userId, result.currencyId);
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



/**
 * activating token for admin
 * @param req 
 * @param res 
 * @param next 
 * @param walletId 
 * @param adminId 
 * @param currencyId 
 */
let activateAdminToken = async (req, res, next) => {
    let { id } = req.admin;
    try {
        await Wallets.findOne({ adminId: id, symbol: 'ETH', status: true }).then(async (wallet) => {
            if (wallet) {
                await Wallets.updateMany({ adminId: id, type: 'erc20', walletType: "admin" }, { $set: { account_name: wallet.account_name, address: wallet.address, password: wallet.password, status: true } }).then((tokenStatus) => {
                    if (tokenStatus) {
                        res.status(200).json(tokenStatus)
                    }
                }).catch((error) => {
                    res.status(200).json({ success: false, msg: error })
                });
            } else {
                res.json({msg: "no eth"})
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
 * getting admin profile
 */
let getAdminProfile = async (req, res, next) => {
    try {
        let admin = await Admin.findOne({ _id: req.admin.id }, { password: 0 });
        if (admin) {
            res.status(200).json(admin);
        } else {
            res.status(200).json({ success: false, msg: 'No admin details found' });
        }
    } catch (error) {
        console.log(error);
    }
};

/**
 * getting user trade ordrrs full details for trade
 */
let getUserTopupForTrade = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, userId } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search == '' || req.query.search == 'undefined') {
            filter = { userId: userId, txType: { $ne: "privateWallet" } };
        } else {
            var search = req.query.search;
            filter = { userId: userId, txType: { $ne: "privateWallet" }, $or: [{ cryptoType: { $regex: search, '$options': 'i' } }, { txType: { $regex: search, '$options': 'i' } }, { status: { $regex: search, '$options': 'i' } }, { type: { $regex: search, '$options': 'i' } }] };
        }
        let trx = await Trade.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await Trade.find(filter).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ status: false, message: 'Internal Server Error' });
        console.log(error);
    }
};

/**
 * getting user  withdraw full details for trade
 */
let getUserWithdrawForTrade = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, userId } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search == '' || req.query.search == 'undefined') {
            filter = { userId: userId, type: "debit", txType: "privateWallet" };
        } else {
            var search = req.query.search;
            filter = { userId: userId, type: "debit", txType: "privateWallet", $or: [{ cryptoType: { $regex: search, '$options': 'i' } }, { status: { $regex: search, '$options': 'i' } }] };
        }
        let trx = await Trade.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await Trade.find(filter).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ status: false, message: 'Internal Server Error' });
        console.log(error);
    }
};

/**
 * getting user topup requests full details for trade
 */
let getUserTopupRequests = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, userId } = req.query;
        let pgNo = Number(pageIndex);
        let recordPerPage = Number(pageSize);
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search == '' || req.query.search == 'undefined') {
            filter = { userId: userId, type: "credit", txType: "privateWallet" };
        } else {
            var search = req.query.search;
            filter = { userId: userId, type: "credit", txType: "privateWallet", $or: [{ cryptoType: { $regex: search, '$options': 'i' } }, { status: { $regex: search, '$options': 'i' } }] };
        }
        let trx = await Trade.find(filter).skip(pageSkip).limit(recordPerPage).sort({ createdDate: -1 });
        let count = await Trade.find(filter).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ status: false, message: 'Internal Server Error' });
        console.log(error);
    }
};

/**
 * transfer crypto from admin personal account to user personal account 
 */
let transferCryptoToUsers = async (req, res, next) => {
    try {
        let { userId, cryptoTyp, cryptoAmt, txid } = req.body;
        let amountToTransfer = cryptoAmt;
        if (cryptoTyp == 'BTC') {

            Wallets.findOne({ userId: userId }, async (err, wallets) => {
                if (err) {
                    res.status(200).json({ success: false, msg: err, type: 'sending btc to other user' });
                }
                else {
                    let btcquantity = parseFloat(amountToTransfer).toFixed(8);
                    let userBtcAddress = wallets.bitcoin.address;
                    let userBtcAccount = wallets.bitcoin.name;
                    let adminBtcAccountBtc = AdminDetailsForTrade.btc.name;
                    let adminBtcAddressBtc = AdminDetailsForTrade.btc.address;


                    let senderBalance = await getBTCBalance(adminBtcAccountBtc);
                    let realBalance = senderBalance / 1000000000000000000;
                    if (senderBalance < btcquantity) {
                        res.status(200).json({ success: false, msg: "Insufficient Balance", type: 'user balance is insufficient' });
                    } else {
                        // let setTransactionFee = await setBTCTxFee(0.00000001);
                        let result = await transferBTCAmount(adminBtcAccountBtc, userBtcAddress, btcquantity, 1);
                        if (result) {
                            let details = new SendReceiveTrx({
                                senderAddress: adminBtcAddressBtc,
                                receiverAddress: userBtcAddress,
                                amount: btcquantity,
                                txId: result.transactionHash,
                                adminId: req.admin.id,
                                currencyType: 'BTC',
                                trnxType: 'send'
                            });
                            details.save(async (err, btcDoc) => {
                                if (err) {
                                    res.status(200).json({ success: false, msg: "Error sending" });
                                } else {
                                    setTimeout(async () => {
                                        try {
                                            let balance = await getBTCBalance(adminBtcAccountBtc);
                                            let updatedBalance = balance / 1000000000000000000;
                                            while (updatedBalance == realBalance) {
                                                let balance = await getBTCBalance(adminBtcAccountBtc);
                                                updatedBalance = balance / 1000000000000000000;
                                            }
                                            // sendReceiveBTCPusher(btcDoc, updatedBalance, 'send');
                                        }
                                        catch (e) { console.log('get baance error', e); }
                                    }, 5000);
                                    res.status(200).json({ success: true, msg: `${amountToTransfer} bitcoin transfer to ${userBtcAddress}` });
                                }
                            });
                            let updatedData = {};
                            updatedData['withdrawalStatus'] = 'completed';
                            let updatedKyc = await Trade.findOneAndUpdate({ _id: txid }, updatedData);
                        }
                    }
                }
            });
        } else if (cryptoTyp == 'ETH') {
            console.log('I am here in eth')
        }
    } catch (error) {
        console.log(error);
    }



};



export {
    adminRegister,
    adminLogin,
    getAdminProfile,
    getUserTopupForTrade,
    getUserWithdrawForTrade,
    getUserTopupRequests,
    transferCryptoToUsers,
    genrateWallet,
    activateAdminToken
}