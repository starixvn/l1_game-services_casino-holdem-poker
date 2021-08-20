import PokerRule from '../poker-rule';
import { ranks } from '../constants';
import CardCombination from '../card-combination';

describe('CardCombination test', () => {
  describe('getResult', () => {
    it('should return royal flush', () => {
      // Arrange
      const cards = [{ rank: 0 }, { rank: 12 }, { rank: 11 }, { rank: 10 }, { rank: 9 }];
      const pokerResult = {
        pair: [],
        threeOfAKind: [],
        sequence: true,
        suit: true,
        fourOfAKind: [],
        cards,
        margin: { max: cards[0], min: cards[4] },
      };
      PokerRule.prototype.combinationResult = jest.fn().mockReturnValue(pokerResult);
      const cardCombination = new CardCombination(cards);
      const expected = {
        id: ranks.royalFlush,
        combinationCards: cards,
        cards,
      };

      // Act
      const actual = cardCombination.getResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return straight flush', () => {
      // Arrange
      const cards = [{ rank: 12 }, { rank: 11 }, { rank: 10 }, { rank: 9 }, { rank: 8 }];
      const pokerResult = {
        pair: [],
        threeOfAKind: [],
        sequence: true,
        suit: true,
        fourOfAKind: [],
        cards,
        margin: { max: cards[0], min: cards[4] },
      };
      PokerRule.prototype.combinationResult = jest.fn().mockReturnValue(pokerResult);
      const cardCombination = new CardCombination(cards);
      const expected = {
        id: ranks.straightFlush,
        combinationCards: cards,
        cards,
      };

      // Act
      const actual = cardCombination.getResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return full house', () => {
      // Arrange
      const cards = [{ rank: 12 }, { rank: 12 }, { rank: 12 }, { rank: 9 }, { rank: 9 }];
      const pokerResult = {
        pair: [[cards[3], cards[4]]],
        threeOfAKind: [[cards[0], cards[1], cards[2]]],
        sequence: false,
        suit: false,
        fourOfAKind: [],
        cards,
        margin: { max: cards[0], min: cards[4] },
      };
      PokerRule.prototype.combinationResult = jest.fn().mockReturnValue(pokerResult);
      const cardCombination = new CardCombination(cards);
      const expected = {
        id: ranks.fullHouse,
        combinationCards: cards,
        cards,
      };

      // Act
      const actual = cardCombination.getResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return full house', () => {
      // Arrange
      const cards = [{ rank: 12 }, { rank: 12 }, { rank: 9 }, { rank: 9 }, { rank: 8 }];
      const pokerResult = {
        pair: [
          [cards[2], cards[3]],
          [cards[0], cards[1]],
        ],
        threeOfAKind: [],
        sequence: false,
        suit: false,
        fourOfAKind: [],
        cards,
        margin: { max: cards[0], min: cards[4] },
      };
      PokerRule.prototype.combinationResult = jest.fn().mockReturnValue(pokerResult);
      const cardCombination = new CardCombination(cards);
      const expected = {
        id: ranks.twoPairs,
        combinationCards: pokerResult.pair[1].concat(pokerResult.pair[0]),
        cards,
      };

      // Act
      const actual = cardCombination.getResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return one pair', () => {
      // Arrange
      const cards = [{ rank: 1 }, { rank: 3 }, { rank: 5 }, { rank: 10 }, { rank: 1 }];
      const pokerResult = {
        pair: [[cards[0], cards[4]]],
        threeOfAKind: [],
        sequence: false,
        suit: false,
        fourOfAKind: [],
        cards: [cards[3], cards[2], cards[1], cards[0], cards[4]],
        margin: { max: { rank: 10 }, min: { rank: 1 } },
      };
      PokerRule.prototype.combinationResult = jest.fn().mockReturnValue(pokerResult);
      const cardCombination = new CardCombination(cards);
      const expected = {
        id: ranks.onePair,
        combinationCards: pokerResult.pair[0],
        cards: [{ rank: 1 }, { rank: 1 }, { rank: 10 }, { rank: 5 }, { rank: 3 }],
      };

      // Act
      const actual = cardCombination.getResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
