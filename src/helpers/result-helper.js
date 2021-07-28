export const generateResult = (communityCards, deck) => {
  const result = {
    communityCards: [...communityCards],
  };
  while (result.communityCards.length < 5) {
    const card = deck.shift();
    result.communityCards.push(card);
  }
  result.dealer = [deck[0], deck[1]];

  return result;
};

export const settleResult = (result) => {
  return {};
};
