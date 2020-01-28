import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;

let emailTemplateSchema = new Schema({
    mailType: { type: String },
    emailBody: { type: String },
    emailBodyFarsi: { type: String },
    createdDate: { type: Date, default: Date.now },
    subject: { type: String },
    subjectFarsi: { type: String },
});

let EmailTemplate = mongoose.model('emailTemplate', emailTemplateSchema);

export { EmailTemplate };