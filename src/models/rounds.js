import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment-reworked';

const modelName = 'CasinoHoldemPoker_phien';

const Schema = new mongoose.Schema({
  result: { type: Object },
  settlementResult: { type: Object },
  roundStartTime: { type: Date },
  time: { type: Date },
  ended: { type: Boolean, default: false },
  uid: { type: String, required: true },
  name: { type: String, required: true },
  odds: { type: Object },
});

Schema.plugin(autoIncrement.MongooseAutoIncrementID.plugin, { modelName, field: 'id' });

export default mongoose.model(modelName, Schema);
