import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


var bbxPairSchema = new Schema({
  OMSId:{type: String},
  created:{type:Date},
  InstrumentId:{type:String},
  Symbol:{type:String},
  Product1Symbol:{type:String},
  Product2Symbol:{type:String},
  SessionStatus:{type:String},
  SessionStatusDateTime:{type:String}
});

let BbxPairSchema = mongoose.model('bbxPair', bbxPairSchema);

export { BbxPairSchema };
