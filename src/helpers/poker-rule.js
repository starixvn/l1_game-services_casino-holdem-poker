export default class PokerRule {
  constructor(cards) {
    this.cards = cards;
  }

  card(rank) {
    const cardFilter = (card) => card.rank === rank;

    return this.cards.findIndex(cardFilter) !== -1;
  }

  margin() {
    const cards = this.cards.sort((cardA, cardB) => cardA.rank - cardB.rank);
    const min = cards.find((card) => card.rank !== 0);
    const max = cards[0].rank === 0 ? cards[0] : cards[cards.length - 1];

    return {
      min,
      max,
    };
  }

  rank(number) {
    const selector = (card) => card.rank;

    return this.getGroupWithCounter(number, selector);
  }

  suit(number) {
    const selector = (card) => card.suit;

    return this.getGroupWithCounter(number, selector);
  }

  sequence() {
    const straights = [
      [9, 10, 11, 12, 0],
      [8, 9, 10, 11, 12],
      [7, 8, 9, 10, 11],
      [6, 7, 8, 9, 10],
      [5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8],
      [3, 4, 5, 6, 7],
      [2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4],
    ];

    const reducer = (hasSequence, straightTemplate) => {
      const cardRemaining = straightTemplate.map((rank) => this.card(rank)).filter((x) => !x);

      return hasSequence || (cardRemaining.length === 0 ? straightTemplate : hasSequence);
    };

    return straights.reduce(reducer, false);
  }

  getGroupWithCounter(number, selector) {
    const group = this.groupCard(selector);
    const filterFn = (group) => group.length === number;

    return Object.values(group).filter(filterFn);
  }

  groupCard(selector) {
    return this.cards.reduce((result, card) => {
      const labels = selector(card);
      if (result[labels]) {
        result[labels].push(card);
      } else {
        result[labels] = [card];
      }

      return result;
    }, {});
  }

  combinationResult() {
    const sequence = this.sequence();
    const pair = this.rank(2);
    const threeOfAKind = this.rank(3);
    const fourOfAKind = this.rank(4);
    const margin = this.margin();
    const suit = this.suit(5).length > 0;

    const cards = this.cards.sort((cardA, cardB) => (cardB.rank || 13) - (cardA.rank || 13));

    if (sequence && margin.min.rank === 1 && margin.max.rank === 0) {
      cards.push(cards.shift());
    }

    return {
      sequence: sequence !== false,
      suit,
      pair,
      threeOfAKind,
      fourOfAKind,
      margin,
      cards,
    };
  }
}
