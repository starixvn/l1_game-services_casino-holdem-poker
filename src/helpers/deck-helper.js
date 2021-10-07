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
  return shuffle(baseDeck, times);
};

export const generateDecks = (presetCards) => {
  const deck = generate(presetCards);
  return presetCards.concat(deck);
};

export const reGenerateDecks = (usedCards) => {
  return generate(usedCards);
};

export const deal = ({ dealer, player, deck, communityCards }) => {
  for (let turn = 1; turn <= 2; turn++) {
    player.push(deck.shift());
    dealer.push(deck.shift());
  }

  communityCards.push(deck.shift(), deck.shift(), deck.shift());
};
