import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


let walletsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    currencyId: { type: Schema.Types.ObjectId, ref: 'Currency' },
    symbol: { type: String, trim: true },
    walletType: {type: String, trim: true },
    title: { type: String, trim: true },
    type: { type: String, trim: true },
    balance: { type: Number, default: 0.0 },
    decimals: { type: Number, default: 0.0 },
    address: { type: String, trim: true },
    secret: { type: String, trim: true },
    account_name: { type: String, trim: true },
    password: { type: String, trim: true },
    account_index: { type: Number, trim: true },
    status: { type: Boolean, trim: true, default: false },
    logo: { type: String },
    contractAddress: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});


let Wallets = mongoose.model('wallets', walletsSchema);

export { Wallets };

