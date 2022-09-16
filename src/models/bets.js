import mongoose from 'mongoose';

const modelName = 'CasinoHoldemPoker_cuoc';

const schema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },

  aa: { type: Number, default: 0 },
  aaOdds: { type: Number, default: 0 },
  ante: { type: Number, default: 0 },
  anteOdds: { type: Number, default: 0 },
  call: { type: Number, default: 0 },
  callOdds: { type: Number, default: 0 },
  callTime: { type: Date },
  isFold: { type: Boolean, default: false },
  cards: { type: Array, default: [] },

  bet: { type: Number, default: 0 },
  betwin: { type: Number, default: 0 },
  time: { type: Date },
  endTime: { type: Date },
  result: { type: Object },
  settlementResult: { type: Object },

  siteId: { type: String },
  freeBet: { type: Boolean, default: false },
  currency: { type: String, require: true },
  rate: { type: Number, require: true },

  playerId: { type: Number },
  operatorId: { type: String, required: false },
  swapTime: { type: Date },
  holdTime: { type: Date },
  roundId: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
});

const bets = mongoose.model(modelName, schema);

export { bets as CasinoHoldemPokerBets };
