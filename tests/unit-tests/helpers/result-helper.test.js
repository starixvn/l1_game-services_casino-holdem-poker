import { combination } from '../../../src/helpers/combination-helper';
import { ranks } from '../../../src/helpers/constants';
import CardCombination from '../../../src/helpers/card-combination';
import {
  compareCombination,
  isWinAA,
  generateResult,
  getSettleResult,
  isQualified,
} from '../../../src/helpers/result-helper';

jest.mock('../../../src/helpers/poker-rule.js');
jest.mock('../../../src/helpers/combination-helper');
describe('result-helper test', () => {
  describe('generateResult', () => {
    it('should return expected', () => {
      // Arrange
      const communityCards = [{ rank: 1 }, { rank: 2 }, { rank: 3 }];
      const deck = [{ rank: 4 }, { rank: 5 }, { rank: 5 }, { rank: 7 }, { rank: 10 }, { rank: 10 }];
      const expected = [...communityCards, deck[0], deck[1]];

      // Act
      const actual = generateResult(communityCards, deck);

      // Assert
      expect(deck.length).toBe(4);
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('getSettleResult', () => {
    it('should throw error when cards undefine', () => {
      // Arrange
      const fn = () => {
        getSettleResult();
      };

      // Assert
      expect(fn).toThrow(Error);
    });

    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 1 }, { rank: 3 }, { rank: 5 }, { rank: 10 }, { rank: 1 }];
      combination.mockReturnValue([cards, cards]);
      CardCombination.prototype.getResult = jest
        .fn()
        .mockReturnValueOnce({ id: 1 })
        .mockReturnValueOnce({ id: 2 });
      const expected = { id: 2 };

      // Act
      const actual = getSettleResult(cards);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('compareCombination', () => {
    it('should return expected when different id', () => {
      // Arrange
      const expected = 2;

      // Act
      const actual = compareCombination({ id: 1 }, { id: 3 });

      // Assert
      expect(actual).toBe(expected);
    });

    describe('when equal id', () => {
      it('should return expected when different combinationCards', () => {
        // Arrange
        const a = { id: 1, combinationCards: [{ rank: 1 }], cards: [] };
        const b = { id: 1, combinationCards: [{ rank: 2 }], cards: [] };
        const expected = 1;

        // Act
        const actual = compareCombination(a, b);

        // Assert
        expect(actual).toBe(expected);
      });

      it('should return expected when equal combinationCards different cards', () => {
        // Arrange
        const a = {
          id: 1,
          combinationCards: [{ rank: 1 }, { rank: 1 }],
          cards: [{ rank: 1 }, { rank: 1 }, { rank: 0 }, { rank: 2 }],
        };
        const b = {
          id: 1,
          combinationCards: [{ rank: 1 }, { rank: 1 }],
          cards: [{ rank: 1 }, { rank: 1 }, { rank: 0 }, { rank: 1 }],
        };
        const expected = -1;

        // Act
        const actual = compareCombination(a, b);

        // Assert
        expect(actual).toBe(expected);
      });

      it('should return 0 when equal', () => {
        // Arrange
        const a = { id: 1, combinationCards: [{ rank: 0 }], cards: [{ rank: 0 }, { rank: 2 }] };

        // Act
        const actual = compareCombination(a, a);

        // Assert
        expect(actual).toBe(0);
      });
    });
  });

  describe('isQualified', () => {
    it('should return true when id greater than one pair', () => {
      // Arrange
      const result = { id: ranks.twoPairs };

      // Act
      const actual = isQualified(result);

      // Assert
      expect(actual).toBeTrue();
    });

    it('should return false when id is high card', () => {
      // Arrange
      const result = { id: ranks.highCards };

      // Act
      const actual = isQualified(result);

      // Assert
      expect(actual).toBeFalse();
    });

    it('should return false when result is one pair 2', () => {
      // Arrange
      const result = { id: ranks.onePair, cards: [{ rank: 2 }, { rank: 2 }] };

      // Act
      const actual = isQualified(result);

      // Assert
      expect(actual).toBeFalse();
    });

    it('should return true when result is pairAces', () => {
      // Arrange
      const result = { id: ranks.onePair, cards: [{ rank: 0 }, { rank: 0 }] };

      // Act
      const actual = isQualified(result);

      // Assert
      expect(actual).toBeTrue();
    });

    it('should return true when result is one pair 4', () => {
      // Arrange
      const result = { id: ranks.onePair, cards: [{ rank: 3 }, { rank: 3 }] };

      // Act
      const actual = isQualified(result);

      // Assert
      expect(actual).toBeTrue();
    });
  });

  describe('isWinAA', () => {
    it('should return true when result is two pairs', () => {
      // Arrange
      const result = { id: ranks.twoPairs };

      // Act
      const actual = isWinAA(result);

      // Assert
      expect(actual).toBeTrue();
    });

    it('should return true when result is pairs Aces', () => {
      // Arrange
      const result = { id: ranks.onePair, cards: [{ rank: 0 }, { rank: 0 }] };

      // Act
      const actual = isWinAA(result);

      // Assert
      expect(actual).toBeTrue();
    });

    it('should return true when result is high card', () => {
      // Arrange
      const result = { id: ranks.highCards };

      // Act
      const actual = isWinAA(result);

      // Assert
      expect(actual).toBeFalse();
    });
  });
});
