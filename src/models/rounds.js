import mongoose from 'mongoose';

const modelName = 'CasinoHoldemPoker_phien';

const Schema = new mongoose.Schema({
  id: { type: Number, default: 0, required: true },
  result: { type: Object },
  settlementResult: { type: Object },
  roundStartTime: { type: Date },
  time: { type: Date },
  ended: { type: Boolean, default: false },
  uid: { type: String, required: true },
  name: { type: String, required: true },
  exchangeRateId: { type: Number, required: true },
  odds: { type: Object },
  md5: { type: String, required: true },
  encryptedMD5: { type: Object, required: true },
  encryptedResult: { type: Object, required: true },
  isSwappedOrHold: { type: Boolean, default: false },
});

export default mongoose.model(modelName, Schema);
