import * as mongoose from 'mongoose';

var Schema = mongoose.Schema;


var LogSchema = new Schema({
    userid: {
        type: Schema.ObjectId, trim: true, ref: 'User'
    },
    ip: {
        type: String, required: true, trim: true
    },
    macaddress: {
        type: String, trim: true
    },
    description: {
        type: String, trim: true
    },
    os: {
        type: String, trim: true
    },
    agent: {
        type: String, trim: true
    },
    type: {
        type: String, trim: true
    },
    model: {
        type: String, trim: true
    },
    timestamp: {
        type: Date
    },
    createdAt: {
        type: Date, default: Date.now
    }
});

let LoginLog = mongoose.model('LoginLog', LogSchema);

export { LoginLog };