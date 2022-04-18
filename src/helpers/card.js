const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const cardLabels = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ];

const types = ['♥', '♦', '♣', '♠'];
export const cards = types.flatMap((_, index) => values.map((value) => ({ rank: value, suit: index })));

export const cardToString = (card) => `${cardLabels[card.rank]}${types[card.suit]}`;
