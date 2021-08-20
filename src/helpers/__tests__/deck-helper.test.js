import { reGenerateDecks, deal, generateDecks } from '../deck-helper';

describe('deck-helper test', () => {
  describe('generateDecks', () => {
    it('should return expected', () => {
      // Arrange
      const presetCards = [{ rank: 1 }, { rank: 0 }];

      // Act
      const actual = generateDecks(presetCards);

      // Assert
      expect(actual.length).toBe(52);
      expect(actual[0]).toStrictEqual(presetCards[0]);
      expect(actual[1]).toStrictEqual(presetCards[1]);
    });
  });

  describe('reGenerateDecks', () => {
    it('should return expected', () => {
      // Arrange
      const usedCards = [{ rank: 1 }, { rank: 0 }, { rank: 3 }, { rank: 0 }];

      // Act
      const actual = reGenerateDecks(usedCards);

      // Assert
      expect(actual.length).toBe(48);
    });
  });

  describe('deal', () => {
    it('should run correctly', () => {
      // Arrange
      const deck = [
        { rank: 10 },
        { rank: 11 },
        { rank: 10 },
        { rank: 11 },
        { rank: 1 },
        { rank: 2 },
        { rank: 3 },
      ];
      const data = { dealer: [], player: [], deck: [...deck], communityCards: [] };

      // Act
      deal(data);

      // Assert
      expect(data.player.length).toBe(2);
      expect(data.player[0]).toStrictEqual(deck[0]);
      expect(data.player[1]).toStrictEqual(deck[2]);
      expect(data.dealer.length).toBe(2);
      expect(data.dealer[0]).toStrictEqual(deck[1]);
      expect(data.dealer[1]).toStrictEqual(deck[3]);
      expect(data.communityCards.length).toBe(3);
      expect(data.communityCards[0]).toStrictEqual(deck[4]);
      expect(data.communityCards[1]).toStrictEqual(deck[5]);
      expect(data.communityCards[2]).toStrictEqual(deck[6]);
    });
  });
});
