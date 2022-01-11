import { combination } from './combination-helper';
import { ranks } from './constants';
import CardCombination from './card-combination';

export const generateResult = (communityCards, deck) => {
  const communityCardsGenerated =  [...communityCards]
  while (communityCardsGenerated.length < 5) {
    communityCardsGenerated.push(deck.shift());
  }

  return communityCardsGenerated;
};


export const getSettleResult = (cards) => {
  if (cards) {
    const sortedCards = JSON.parse(JSON.stringify(cards)).sort(
      (cardA, cardB) => (cardB.rank || 13) - (cardA.rank || 13),
    );
    const combinations = combination(sortedCards, 5);
    const cardCombinations = combinations
      .map((newCards) => new CardCombination([...newCards]).result)
      .sort(compareCombination);
    return cardCombinations[0];
  }
  throw new Error(`Invalid parameter ${cards}`);
};

export const compareCombination = (a, b) => {
  if (a.id === b.id) {
    for (let index = 0; index < a.combinationCards.length; index++) {
      const rankA = a.combinationCards[index].rank || 13;
      const rankB = b.combinationCards[index].rank || 13;
      if (rankA !== rankB) {
        return rankB - rankA;
      }
    }
    for (let i = a.combinationCards.length; i < a.cards.length; i++) {
      const rankA = a.cards[i].rank || 13;
      const rankB = b.cards[i].rank || 13;
      if (rankA !== rankB) {
        return rankB - rankA;
      }
    }
    return 0;
  }

  return b.id - a.id;
};

export const isQualified = (result) => {
  if (result.id > ranks.onePair) {
    return true;
  } else {
    return result.id === ranks.onePair
      ? result.cards[0].rank >= 3 || result.cards[0].rank === 0
      : false;
  }
};

export const isWinAA = (result) => {
  if (result.id > ranks.onePair) {
    return true;
  } else {
    return result.id === ranks.pairAces ? result.cards[0].rank === 0 : false;
  }
};
