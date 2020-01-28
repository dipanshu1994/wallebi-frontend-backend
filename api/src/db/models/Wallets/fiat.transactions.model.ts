import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

var fiatTransactions = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    currencyId: { type: Schema.Types.ObjectId, ref: 'Currency' },
    providerId: { type: Schema.Types.ObjectId, ref: 'TradeFromLiquidity' },
    amount: { type: Number },
    type: { type: String, enum: ["debit", "credit"], default: 'credit' },
    currency: { type: String },
    cryptoAmount: { type: String },
    authority: { type: String },
    paymentmethod: { type: String },
    euroRate: { type: Number },
    gatewayData: { type: Object },
    bankId: { type: Schema.Types.ObjectId, ref: 'bankAccounts' },
    withdrawSend: { type: String, enum: ["Y", "N"], default: 'N' },
    withdrawId: { type: Number },
    transferFromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ["pending", "processing", "completed"], default: 'pending' },
    txType: { type: String },
    tradeId: { type: Schema.Types.ObjectId, ref: 'trade' },
    payee: { type: String },
    payeeFullname: { type: String },
    payeeCountry: { type: String },
    payeeEmail: { type: String },
    payeeMobile: { type: String },
    payeeAddress: { type: String },
    reference: { type: String },
    createdDate: { type: Date, default: Date.now },
    response_code: { type: String },
    response_Tracking_Code: { type: String },
    response_Description: { type: String },
});


let FiatTransactions = mongoose.model('fiatTransactions', fiatTransactions);

export { FiatTransactions };
