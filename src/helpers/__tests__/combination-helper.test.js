import { combination } from '../combination-helper';

describe('combination test', () => {
  it('should return expected', () => {
    // Arrange
    const cards = [
      { rank: 1 },
      { rank: 2 },
      { rank: 3 },
      { rank: 4 },
      { rank: 5 },
      { rank: 6 },
      { rank: 7 },
    ];

    // Act
    const actual = combination(cards, 5);

    // Assert
    expect(actual.length).toBe(21);
    expect(actual).toSatisfyAll((array) => array.length === 5);
  });
});
