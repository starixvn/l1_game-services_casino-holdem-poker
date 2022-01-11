import PokerRule from '../../../src/helpers/poker-rule';

describe('PokerRule test', () => {
  describe('card', () => {
    const cards = [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }];
    const poker = new PokerRule(cards);
    it('should return true when card exist', () => {
      // Act
      const actual = poker.card(1);

      // Assert
      expect(actual).toBeTrue();
    });

    it('should return false when card not exist', () => {
      // Act
      const actual = poker.card(0);

      // Assert
      expect(actual).toBeFalse();
    });
  });

  describe('margin', () => {
    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 1 }];
      const poker = new PokerRule(cards);

      // Act
      const actual = poker.margin();

      // Assert
      expect(actual.min.rank).toBe(1);
      expect(actual.max.rank).toBe(5);
    });

    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 0 }];
      const poker = new PokerRule(cards);

      // Act
      const actual = poker.margin();

      // Assert
      expect(actual.min.rank).toBe(2);
      expect(actual.max.rank).toBe(0);
    });
  });

  describe('rank', () => {
    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 2 }];
      const poker = new PokerRule(cards);
      const expected = [[cards[0], cards[4]]];
      poker.getGroupWithCounter = jest.fn().mockReturnValue(expected);

      // Act
      const actual = poker.rank(2);

      // Assert
      expect(poker.getGroupWithCounter).toHaveBeenCalledWith(2, expect.any(Function));
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 2 }];
      const poker = new PokerRule(cards);
      const expected = [[cards[0], cards[4]]];

      // Act
      const actual = poker.rank(2);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('suit', () => {
    it('should return expected', () => {
      // Arrange
      const cards = [{ suit: 2 }, { suit: 3 }, { suit: 0 }, { suit: 2 }, { suit: 2 }];
      const poker = new PokerRule(cards);
      const expected = [[cards[0], cards[3], cards[4]]];
      poker.getGroupWithCounter = jest.fn().mockReturnValue(expected);

      // Act
      const actual = poker.suit(3);

      // Assert
      expect(poker.getGroupWithCounter).toHaveBeenCalledWith(3, expect.any(Function));
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected', () => {
      // Arrange
      const cards = [{ suit: 2 }, { suit: 2 }, { suit: 2 }, { suit: 2 }, { suit: 2 }];
      const poker = new PokerRule(cards);
      const expected = [cards];

      // Act
      const actual = poker.suit(5);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('sequence', () => {
    it('should return false', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 5 }, { rank: 5 }, { rank: 2 }];
      const poker = new PokerRule(cards);

      // Act
      const actual = poker.sequence();

      // Assert
      expect(actual).toBeFalse();
    });

    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }];
      const poker = new PokerRule(cards);
      const expected = [1, 2, 3, 4, 5];

      // Act
      const actual = poker.sequence();

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('getGroupWithCounter', () => {
    it('should return expected', () => {
      // Arrange
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 2 }];
      const poker = new PokerRule(cards);
      const expected = [[cards[0], cards[4]]];
      const group = {
        2: [cards[0], cards[4]],
        3: [cards[1]],
        4: [cards[2]],
        5: [cards[3]],
      };
      poker.groupCard = jest.fn().mockReturnValue(group);

      // Act
      const actual = poker.getGroupWithCounter(2, jest.fn());

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('groupCard', () => {
    it('should return expected', () => {
      const cards = [{ rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }, { rank: 2 }];
      const poker = new PokerRule(cards);
      const expected = {
        2: [cards[0], cards[4]],
        3: [cards[1]],
        4: [cards[2]],
        5: [cards[3]],
      };

      // Act
      const actual = poker.groupCard((card) => card.rank);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('combinationResult', () => {
    it('should return expected', () => {
      const cards = [{ rank: 8 }, { rank: 5 }, { rank: 4 }, { rank: 3 }, { rank: 0 }];
      const poker = new PokerRule(cards);
      const expected = {
        sequence: false,
        suit: false,
        pair: [],
        threeOfAKind: [],
        fourOfAKind: [],
        margin: { max: cards[4], min: cards[0] },
        cards,
      };
      poker.sequence = jest.fn().mockReturnValue(false);
      poker.rank = jest.fn().mockReturnValue([]);
      poker.margin = jest.fn().mockReturnValue(expected.margin);
      poker.suit = jest.fn().mockReturnValue([]);

      // Act
      const actual = poker.combinationResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected', () => {
      const cards = [{ rank: 0 }, { rank: 4 }, { rank: 3 }, { rank: 2 }, { rank: 1 }];
      const poker = new PokerRule(cards);
      const expected = {
        sequence: true,
        suit: false,
        pair: [],
        threeOfAKind: [],
        fourOfAKind: [],
        margin: { max: cards[0], min: cards[4] },
        cards: [cards[1], cards[2], cards[3], cards[4], cards[0]],
      };
      poker.sequence = jest.fn().mockReturnValue([0, 1, 2, 3, 4]);
      poker.rank = jest.fn().mockReturnValue([]);
      poker.margin = jest.fn().mockReturnValue(expected.margin);
      poker.suit = jest.fn().mockReturnValue([]);

      // Act
      const actual = poker.combinationResult();

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
