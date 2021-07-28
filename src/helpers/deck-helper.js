import Chance from 'chance';
import _ from 'lodash';
const chance = new Chance();
import { cards } from './card';

const shuffle = (array, times = 1) => {
  if (times <= 0) {
    return array;
  } else {
    let lastElementIndex = array.length - 1;

    while (lastElementIndex) {
      const randomIndex = chance.integer({ min: 0, max: lastElementIndex });
      lastElementIndex--;
      const lastElement = array[lastElementIndex];

      array[lastElementIndex] = array[randomIndex];
      array[randomIndex] = lastElement;
    }

    return shuffle(array, times - 1);
  }
};

const generate = (exclusions) => {
  const baseDeck = [...cards];

  if (exclusions) {
    exclusions.forEach((excludeCard) => {
      const index = _.findIndex(baseDeck, excludeCard);
      baseDeck.splice(index, 1);
    });
  }

  const times = chance.integer({ min: 3, max: 10 });
  return chance.shuffle(baseDeck, times);
};

export const generateDecks = (presetCards) => {
  const deck = generate(presetCards);
  const finalDeck = presetCards.concat(deck);

  return finalDeck;
};

export const reGenerateDecks = (usedCards) => {
  const deck = generate(usedCards);

  return deck;
};
