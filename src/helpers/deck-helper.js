import Chance from 'chance';
import _ from 'lodash';
import { shuffle as d3Shuffle } from 'd3-array';
import { Random as RandomJS, MersenneTwister19937 } from 'random-js';
import Random from 'random';
import { randomInt } from 'crypto';
import { cards } from './card';

const chance = new Chance();

export const mathRandom = () => {
  return Math.random(); // NOSONAR
};

const random1 = (max) => {
  return Math.floor(mathRandom() * max);
};

const random2 = (max) => {
  return chance.integer({ min: 0, max });
};

const random3 = (max) => {
  return Random.int(0, max);
};

const random4 = (max) => {
  const randomJS = new RandomJS(MersenneTwister19937.autoSeed());

  return randomJS.integer(0, max);
};

const random5 = (max) => {
  return randomInt(max + 1);
};

const random6 = (max) => {
  const seed = Math.floor(mathRandom() * 100000);
  const randomJS = new RandomJS(MersenneTwister19937.seed(seed));
  return randomJS.integer(0, max);
};

const randomFunctions = {
  1: [random1, random2, random3],
  2: [random4, random5, random6],
};
const randomCustomize = (mode, max) => {
  const functions = randomFunctions[mode];
  const selectedRandomMethodIndex = Math.floor(mathRandom() * functions.length);
  const randomFunction = functions[selectedRandomMethodIndex];

  return randomFunction(max);
};

const shuffleCards = (deskOfCards) => {
  for (let i = deskOfCards.length - 1; i >= 0; i -= 2) {
    const randomCardIndex = Math.floor(chance.floating({ min: 0, max: 1 }) * (i + 1));
    const term = deskOfCards[i];

    deskOfCards[i] = deskOfCards[randomCardIndex];
    deskOfCards[randomCardIndex] = term;
  }
};

const shuffle1 = (arr) => {
  const deskOfCards = [...arr];

  shuffleCards(deskOfCards);
  shuffleCards(deskOfCards);
  shuffleCards(deskOfCards);

  return deskOfCards;
};

const shuffle2 = (arr) => {
  return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const shuffle3 = (arr) => {
  return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const shuffle4 = (arr) => {
  let result = arr;
  const r = new RandomJS(MersenneTwister19937.autoSeed());

  for (let i = 0; i < 3; i++) {
    result = r.shuffle(arr);
  }

  return result;
};

const shuffle5 = (arr) => {
  return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const shuffleCards2 = (array, mode) => {
  for (let i = 0; i < 3; i++) {
    let lastElementIndex = array.length - 1;

    while (lastElementIndex) {
      const randomIndex = randomCustomize(mode, array.length - 1);
      lastElementIndex--;
      const lastElement = array[lastElementIndex];

      array[lastElementIndex] = array[randomIndex];
      array[randomIndex] = lastElement;
    }
  }
  return array;
};

const shuffle6 = (arr) => {
  return shuffleCards2(arr, 1);
};

const shuffle7 = (arr) => {
  return shuffleCards2(arr, 2);
};

const randomModes = {
  1: [shuffle1, shuffle2, shuffle3],
  2: [shuffle4, shuffle5, shuffle6],
  3: [shuffle3, shuffle5, shuffle7],
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
