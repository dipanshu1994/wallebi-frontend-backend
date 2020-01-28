import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


let sendReceiveTrnx = new Schema({
    senderAddress: { type: String },
    receiverAddress: { type: String },
    amount: { type: Number },
    txId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
    currencyType: { type: String },
    trnxType: { type: String },
    trnxFee: { type: Number },
    trnxn_Obj: { type: Object },
    timestamp: { type: Date },
    TrnxStatus: { type: String, enum: ["pending", "success", "fail"], default: "pending" },
    createdDate: { type: Date, default: Date.now }
});


let SendReceiveTrx = mongoose.model('sendReceiveTrnx', sendReceiveTrnx);

export { SendReceiveTrx };