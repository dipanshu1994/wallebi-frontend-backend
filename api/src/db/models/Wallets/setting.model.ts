import * as mongoose from 'mongoose';
let Schema = mongoose.Schema;


var settingSchema = new Schema({
  created: { type: Date },
  colValue: { type: String, required: true },
  colName: { type: String, required: true },
  colKey: { type: String },
  status: { type: Number, enum: ["0", "1"], default: 0 },
});

let SettingSchema = mongoose.model('setting', settingSchema);

export { SettingSchema };
