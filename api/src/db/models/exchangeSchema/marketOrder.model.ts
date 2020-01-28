import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let marketOrder = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    quantity: { type: Number },
    inputCryptoType: { type: String },
    totalAmount: { type: Number },
    outputCryptaType: { type: String },
    pair: { type: String },
    price: { type: Number },
    typeOfTransaction: { type: String },
    status: {
        type:String,
        default: "Settle"
    },
    partialOrder : {type: Boolean},
    commission: {type: Number},
    createdDate: { type: Date, default: Date.now }
});




let MarketOrder = mongoose.model('marketOrder', marketOrder);

export { MarketOrder };