import PokerRule from './poker-rule';
import { ranks } from './constants';

export default class CardCombination {
  constructor(cards) {
    this.poker = new PokerRule(cards);
    this.metadata = this.poker.combinationResult();
    this.result = this.getResult();
  }

  getResult() {
    const { pair, threeOfAKind, sequence, suit, fourOfAKind, cards, margin } = this.metadata;

    const criterions = {
      royalFlush: {
        condition: suit && sequence && margin.min.rank >= 9,
        id: ranks.royalFlush,
        combinationCards: cards,
      },
      straightFlush: {
        condition: suit && sequence,
        id: ranks.straightFlush,
        combinationCards: cards,
      },
      fourOfAKind: {
        condition: fourOfAKind.length,
        id: ranks.fourKind,
        combinationCards: fourOfAKind[0],
      },
      fullHouse: {
        condition: threeOfAKind.length && pair.length,
        id: ranks.fullHouse,
        combinationCards: threeOfAKind.length && pair.length ? threeOfAKind[0].concat(pair[0]) : [],
      },
      flush: {
        condition: suit,
        id: ranks.flush,
        combinationCards: cards,
      },
      straight: {
        condition: sequence,
        id: ranks.straight,
        combinationCards: cards,
      },
      threeOfAKind: {
        condition: threeOfAKind.length,
        id: ranks.threeKind,
        combinationCards: threeOfAKind.length ? threeOfAKind[0] : [],
      },
      twoPair: {
        condition: pair.length === 2,
        id: ranks.twoPairs,
        combinationCards: pair.length === 2 ? pair[1].concat(pair[0]) : [],
      },
      pair: {
        condition: pair.length,
        id: ranks.onePair,
        combinationCards: pair.length ? pair[0] : [],
      },
      highCard: {
        condition: true,
        id: ranks.highCards,
        combinationCards: [margin.max],
      },
    };
    const result = Object.values(criterions).find((criteria) => criteria.condition);
    delete result.condition;
    const cardFilter = (card) => !result.combinationCards.includes(card);
    result.cards = result.combinationCards.concat(cards.filter(cardFilter));
    return result;
  }
}
