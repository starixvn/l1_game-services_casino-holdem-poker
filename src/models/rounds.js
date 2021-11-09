import mongoose from 'mongoose';

const modelName = 'CasinoHoldemPoker_phien';

const Schema = new mongoose.Schema({
  id: { type: Number, default: 0 },
  result: { type: Object },
  settlementResult: { type: Object },
  roundStartTime: { type: Date },
  time: { type: Date },
  ended: { type: Boolean, default: false },
  uid: { type: String, required: true },
  name: { type: String, required: true },
  odds: { type: Object },
  md5: { type: String, require: true },
  resultKey: { type: String, require: true },
  resultGenerated: { type: Object },
});

export default mongoose.model(modelName, Schema);
