import Chance from 'chance';
import _ from 'lodash';
import { shuffle as d3Shuffle } from 'd3-array';
import { Random as RandomJS, MersenneTwister19937 } from 'random-js';
import { cards } from './card';

const chance = new Chance();

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

const random1 = (array) => {
  const times = chance.integer({ min: 3, max: 10 });

  return shuffle(array, times);
};

const random2 = (arr) => {
  return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const random3 = (arr) => {
  return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const random4 = (arr) => {
  let result = arr;
  const r = new RandomJS(MersenneTwister19937.autoSeed());

  for (let i = 0; i < 3; i++) {
    result = r.shuffle(arr);
  }

  return result;
};

const random5 = (arr) => {
  return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const randomModes = {
  1: [random1],
  2: [random2, random3],
  3: [random4, random5],
};

const generate = (exclusions, randomMode) => {
  const randomShuffles = randomModes[randomMode] || randomModes[1];
  const baseDeck = [...cards];

  if (exclusions) {
    exclusions.forEach((excludeCard) => {
      const index = _.findIndex(baseDeck, excludeCard);
      baseDeck.splice(index, 1);
    });
  }

  const randomShuffle = chance.pickone(randomShuffles);

  return randomShuffle(baseDeck);
};

export const generateDecks = (presetCards, randomMode) => {
  const deck = generate(presetCards, randomMode);
  return presetCards.concat(deck);
};

export const reGenerateDecks = (usedCards, randomMode) => {
  return generate(usedCards, randomMode);
};

export const deal = ({ dealer, player, deck, communityCards }) => {
  for (let turn = 1; turn <= 2; turn++) {
    player.push(deck.shift());
    dealer.push(deck.shift());
  }

  communityCards.push(deck.shift(), deck.shift(), deck.shift());
};
