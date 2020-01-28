import * as mongoose from 'mongoose';

var Schema = mongoose.Schema;


var AdminSchema = new Schema({
    fullName: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
});



let Admin = mongoose.model('Admin', AdminSchema);

export { Admin };