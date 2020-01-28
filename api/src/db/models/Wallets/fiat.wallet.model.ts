import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


let fiatWalletSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    currencyId: { type: Schema.Types.ObjectId, ref: 'Currency' },
    walletType: {type: String, trim: true },
    symbol: { type: String, trim: true },
    title: { type: String, trim: true },
    type: { type: String, trim: true },
    balance: { type: Number, default: 0.0 },
    status: { type: Boolean, trim: true, default: true },
    logo: { type: String },
    createdAt: { type: Date, default: Date.now }
});


let FiatWallet = mongoose.model('fiatWallet', fiatWalletSchema);

export { FiatWallet };