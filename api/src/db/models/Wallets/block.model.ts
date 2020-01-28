import * as mongoose from 'mongoose';


let BlockSchema = new mongoose.Schema({
    symbol: { type: String, required: true, trim: true },
    number: { type: Number, required: true, trim: true },
    lastBlock: { type: Number, trim: true },
    blockID: { type: String, trim: true },
    parentHash: { type: String, trim: true },
    full_block: { type: Object, trim: true },
    createdAt: { type: Date, default: Date.now }
})
let Blocks = mongoose.model('Blocks', BlockSchema);



export { Blocks };

