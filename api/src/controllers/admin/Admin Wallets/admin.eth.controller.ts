import { Admin } from "../../../db/models/admin/admin.model";
import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { newAccount, getBalance, unlockAddress, sendTransaction } from "../../../services/WalletService/eth.Service";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";
import { etherumBalance } from "../../Wallets/ethController";
import { sendReceiveETHPusher } from "../../../services/Pusher/pusher";
import { activateAdminToken } from "../Admin-Users/admin.controller";





/**
 * activating eth wallet controller
 * @param adminId 
 */
let activateAdminEthereumWallet = async (req, res, next) => {
    try {
        let { id, symbol, title, currencyId } = req.body;
        Admin.findOne({ _id: req.admin.id }, async (err, admin) => {
            if (err || admin === null) {
                res.status(200).json({ success: false, msg: err, type: 'activate ETH' });
            } else {
                let ethWalletPassword = `ethereum_${admin.firstname}_${Date.now()}`;
                let ethAddress = await newAccount(ethWalletPassword);
                // let ethAddress = {address: 'dfndsfhskfhksjdfhkjdsfjksdf', key: 'dsfbjsdfjdsbfjsbfjbfjbsjdfbjdsf'};
                if (ethAddress) {
                    let etheremData = { address: ethAddress.address, password: ethAddress.key, account_name: ethWalletPassword, status: true };
                    await Wallets.findOneAndUpdate({ symbol: 'ETH', adminId: req.admin.id }, etheremData, { new: true }).then((result) => {
                        if (result) {
                            res.status(200).json({ success: true, msg: `${result.title} is activated!`, type: 'ethereum wallet activated!' });
                            activateAdminToken(req, res, next);
                        }
                    }).catch((error) => {
                        console.log(error);
                        res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate ETH' });
                    });
                } else {
                    res.status(200).json({ success: false, msg: 'Something went wrong!', type: 'activate ETH' });
                }
            }
        });
    } catch (error) {
        res.status(200).json({ success: false, msg: error, type: 'activate ETH' });
        console.log(error);
    }
};






/**
 * send eth to others
 */
let sendEthereumToOther = (req, res, next) => {
    try {

        let { cryptoAmount, ethWithFee, receiversAddress, currencyId } = req.body;
        let amoutToTransfer = cryptoAmount;
        let amountToTransferWithFee = ethWithFee;

        Wallets.findOne({ adminId: req.admin.id, currencyId: currencyId }, async (err, wallets) => {
            if (err) {
                res.status(200).json({ success: false, msg: "Insufficient Balance" });
            } else {
                let adminEthAddress = wallets.address;
                let adminEthAddressPass = wallets.password;
                let ethereumBalance = await getBalance(adminEthAddress);
                let realBalance = ethereumBalance / 1000000000000000000;
                if (cryptoAmount > realBalance) {
                    res.status(200).json({ success: false, msg: "Your ethereum balance is insufficient!", type: 'send ETH to other admin' });
                } else {
                    let unlock = await unlockAddress(adminEthAddress, adminEthAddressPass);
                    if (unlock) {
                        let data = await sendTransaction(adminEthAddress, receiversAddress, amoutToTransfer);
                        let details = new SendReceiveTrx({
                            senderAddress: adminEthAddress,
                            receiverAddress: receiversAddress,
                            amount: amoutToTransfer,
                            txId: data.transactionHash,
                            adminId: req.admin.id,
                            currencyType: 'ETH',
                            trnxType: 'send'
                        });
                        details.save(async (err, ethDoc) => {
                            if (err) {
                                res.status(200).json({ success: false, msg: "Insufficient Balance" });
                            }
                            else {
                                res.success(200).json({ success: true, msg: `${cryptoAmount} ethereum transfer to the ${receiversAddress}` });
                                await etherumBalance(adminEthAddress).then(async (ethereumBalance: any) => {
                                    await Wallets.findOneAndUpdate({ adminId: req.admin.id, currencyId: currencyId }, { balance: ethereumBalance }).then((result) => {
                                        if (result) {
                                            let updatedBalance = ethereumBalance / 1000000000000000000;
                                            sendReceiveETHPusher(ethDoc, updatedBalance, 'send');
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
    activateAdminEthereumWallet,
    sendEthereumToOther,
}
