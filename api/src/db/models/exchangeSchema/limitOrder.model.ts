import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let limitOrder = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  quantity: { type: Number },
  inputCryptoType: { type: String },
  totalAmount: { type: Number },
  outputCryptaType: { type: String },
  pair: { type: String },
  price: { type: Number },
  typeOfTransaction: { type: String },
  orderType: { type: String },
  partial: { type: Boolean },
  commission: {type: Number},
  transactionId : { type: String },
  status: { type: String, enum: ["pending", "processing", "completed"], default: 'pending' },
  createdDate: { type: Date, default: Date.now }
});





let LimitOrder = mongoose.model('limitOrder', limitOrder);

export { LimitOrder };