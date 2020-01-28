import { Wallets } from "../../../db/models/Wallets/wallet.model";
import { SendReceiveTrx } from "../../../db/models/Wallets/sendReceiveTransaction.model";


/**
 * getting all wallet for displaying to the admin
 * @param req 
 * @param res 
 * @param next 
 */
let getAdminWallet = async (req, res, next) => {
    try {
        await Wallets.find({adminId: req.admin.id}).populate('currencyId').then((wallet) => {
            res.status(200).json(wallet);
        }).catch((error) => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
};



// getting the admin send and receive transaction of crypto from our database to display on the front-end
let sendReciveCryptoTnxAdmin = async (req, res, next) => {
    try {
        let { pageIndex, pageSize, search, symbol } = req.query;
        let pgNo = Number(pageIndex);//|| 1;
        let recordPerPage = Number(pageSize);// || 4;
        let pageSkip = Math.abs(recordPerPage * pgNo);
        let filter = {};
        if (req.query.search === '' || req.query.search === 'undefined') {
            filter = { adminId: req.admin.id, currencyType: symbol };
        } else {
            filter = { adminId: req.admin.id, currencyType: symbol, $or: [{ receiverAddress: { $regex: search } }, { txId: { $regex: search } }, { currencyType: { $regex: search } }, { type: { $regex: search } }] };
        }
        let trx = await SendReceiveTrx.find(filter).skip(pageSkip).limit(recordPerPage).sort({ timestamp: -1 });
        let count = await SendReceiveTrx.find({ adminId: req.admin.id, currencyType: symbol }).countDocuments();
        res.status(200).json({ transactions: trx, count: count, success: true, current: pgNo, pages: Math.ceil(count / recordPerPage) })
    } catch (error) {
        console.log(error)
    }
};




export {
    getAdminWallet,
    sendReciveCryptoTnxAdmin
}