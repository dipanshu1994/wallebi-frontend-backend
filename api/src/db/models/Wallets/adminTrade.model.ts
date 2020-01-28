import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;



let adminTradeWallet = new Schema({
    tradeId: { type: Schema.Types.ObjectId, ref: 'trades' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    cryptoAmount: { type: Number },
    cryptoType: { type: String },
    txType: { type: String },
    txId: { type: String },
    type: { type: String, enum: ["debit", "credit"], default: 'credit' },
    status: { type: String, enum: ["pending", "processing", "completed"], default: 'pending' },
    createdDate: { type: Date, default: Date.now }
});


let AdminTradeWallet = mongoose.model('adminTradeWallet', adminTradeWallet);

export { AdminTradeWallet };
