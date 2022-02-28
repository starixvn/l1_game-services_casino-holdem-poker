import mongoose from 'mongoose';

const modelName = 'CasinoHoldemPoker_cuoc';

const schema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  phien: { type: Number, default: 0 },

  aa: { type: Number, default: 0 },
  aaOdds: { type: Number, default: 0 },
  ante: { type: Number, default: 0 },
  anteOdds: { type: Number, default: 0 },
  call: { type: Number, default: 0 },
  callOdds: { type: Number, default: 0 },
  callTime: { type: Date },
  isFold: { type: Boolean, default: false },
  cards: { type: Array, default: [] },

  thanhtoan: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  bet: { type: Number, default: 0 },
  betwin: { type: Number, default: 0 },
  time: { type: Date },
  endTime: { type: Date },
  result: { type: Object },
  settlementResult: { type: Object },

  memberId: { type: Number },
  siteId: { type: String },
  freeBet: { type: Boolean, default: false },
  currency: { type: String, require: true },
  rate: { type: Number, require: true },
  partnerId: { type: String, require: true },
});

const bets = mongoose.model(modelName, schema);

export { bets as CasinoHoldemPokerBets };
