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
  exchangeRateId: { type: Number, require: true },
  odds: { type: Object },
  md5: { type: String, require: true },
  resultKeyRaw: { type: String, require: true },
  communityCardsGenerated: { type: Array },
  encryptedMD5: {type: Object , require: true },
  encryptedResult: { type: Object , require: true },
});

export default mongoose.model(modelName, Schema);
