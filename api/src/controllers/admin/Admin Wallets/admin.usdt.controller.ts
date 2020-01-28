import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { createMultiSigWallet, getTetherBalance, transferTetherAmount } from "../../../services/WalletService/ominiUSDT.service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { userTetherBalance } from "../../Wallets/tetherController";
import { sendReceiveUSDTPusher } from "../../../services/Pusher/pusher";



/**
 * activating USDT wallet controller
 * @param adminId 
 * */
let activateAdminTether = async (req, res, next) => {
    try {
        let { currencyId, symbol, title } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate USDT' });
            } else {
                let omniusdtWalletPassword = `omniusdt_${admin.firstname}_${Date.now()}`;
                let omniusdtWallet = await createMultiSigWallet(omniusdtWalletPassword);
                if (omniusdtWallet) {
                    let omniusdtData = { address: omniusdtWallet, account_name: omniusdtWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ currencyId: currencyId, adminId: req.admin.id }, omniusdtData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'tether wallet activated!'});
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate USDT' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate USDT' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
};





/**
 * send usdt to others
 */
let adminSendTetherToOther = async (req, res) => {
    try {
        let { cryptoAmount, usdtWithFee, receiverAddress, usdtToEuro, currencyId } = req.body;
        let amountToTransfer = cryptoAmount;
        let amountToTransferWithFee = usdtWithFee;
        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallet) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance" });
            }
            else {
                let usdtquantity = parseFloat(amountToTransfer).toFixed(8);
                let usdtquantitywithfee = parseFloat(amountToTransferWithFee).toFixed(8);
                let adminTetherAddress = wallet.address;
                let adminTetherAccount = wallet.account_name;
                let senderBalance = await getTetherBalance(adminTetherAddress);
                senderBalance = senderBalance.balance;
                if (senderBalance < usdtquantity) {
                    res.status(200).json({ success: false, msg: "Your tether balance is insufficient!" });
                } else {
                    // let setTransactionFee = await setTxFee(0.00000001);
                    let result = await transferTetherAmount(adminTetherAccount, receiverAddress, usdtquantity, 1);
                    if (result) {
                        let details = new SendReceiveTrx({
                            senderAddress: adminTetherAddress,
                            receiverAddress: receiverAddress,
                            amount: usdtquantity,
                            txId: result.transactionHash,
                            adminId: req.admin.id,
                            currencyType: 'USDT',
                            trnxType: 'send'
                        });
                        details.save(async (err, usdtDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance" });
                            }
                            else {
                                res.status(200).json({ status: true, msg: `${usdtquantity} USDT transferred to ${receiverAddress}` });
                                await userTetherBalance(adminTetherAddress).then(async (adminTetherBalance: any) => {
                                    await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: adminTetherBalance }).then((result) => {
                                        if (result) {
                                            sendReceiveUSDTPusher(usdtDoc, adminTetherBalance, 'send');
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                    });
                                }).catch((error) => {
                                    console.log(error);
                                });
                            }
                        });
                    }
                }

            }
        });
    } catch (error) {
        console.log(error);
    }
}










export {
    activateAdminTether,
    adminSendTetherToOther,
}