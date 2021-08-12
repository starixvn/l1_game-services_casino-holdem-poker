export default {
  id: 39,
  name: 'CasinoHoldemPoker',
  durations: {
    wholeRound: 60,
    botFrequency: 60,
  },
  choices: {
    ante: 'ante',
    call: 'call',
    aa: 'aa',
  },
  choicesMapper: { deal: 1, call: 2 },
  actions: {
    deal: 'deal',
    call: 'call',
    doubleCall: 'doubleCall',
    fold: 'fold',
  },
};
