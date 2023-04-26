import { generateDecks, reGenerateDecks } from '../../src/helpers/deck-helper';
import { compareCombination, getSettleResult } from '../../src/helpers/result-helper';

function generateResult(randomMode) {
  const result = {
    player: [],
    dealer: [],
    community: [],
  };
  const deck1 = generateDecks([], randomMode);

  result.player.push(deck1.shift());
  result.dealer.push(deck1.shift());
  result.player.push(deck1.shift());
  result.dealer.push(deck1.shift());

  const deck2 = reGenerateDecks(result.player.concat(result.dealer), randomMode);

  result.community = [deck2[0], deck2[1], deck2[2], deck2[3], deck2[4]];

  return {
    playerCard: result.player,
    dealerCard: result.dealer,
    communityCard: result.community,
    player: getSettleResult(result.player.concat(result.community)),
    dealer: getSettleResult(result.dealer.concat(result.community)),
  };
}

function getSettlementResult(result) {
  const combinationDealerResult = compareCombination(result.player, result.dealer);

  return {
    dealer: combinationDealerResult > 0,
    player: combinationDealerResult < 0,
    tie: combinationDealerResult == 0,
  };
}

function getCardIndex(rank, suit) {
  return rank * 4 + suit;
}

describe('Running 10000 rounds', () => {
  it.each([1, 2, 3])('Mode %d', (mode) => {
    const totalRounds = 10000;                       
    const streaks = {
      dealer: {},
      player: {},
    };

    const streakNumber = 4;
    const longestStreak = 4;
    let occurrences = 0;
    let prev = 'dealer';
    const stats = {
      streaks: { total: 0, dealer: 0, player: 0 },
    };

    const combinationStats = {
      player: {},
      dealer: {},
    };

    const cardStat = {};

    for (let index = 0; index < totalRounds; index++) {
      const result = generateResult(mode);

      const settlement = getSettlementResult(result);

      combinationStats.player[result.player.id] = combinationStats.player[result.player.id] ?? {
        count: 0,
        ratio: 0,
      };
      combinationStats.dealer[result.dealer.id] = combinationStats.dealer[result.dealer.id] ?? {
        count: 0,
        ratio: 0,
      };

      combinationStats.player[result.player.id].count++;
      combinationStats.dealer[result.dealer.id].count++;
      combinationStats.player[result.player.id].ratio =
        combinationStats.player[result.player.id].count / totalRounds;
      combinationStats.dealer[result.dealer.id].ratio =
        combinationStats.dealer[result.dealer.id].count / totalRounds;

      const allCards = result.playerCard.concat(result.dealerCard, result.communityCard);

      allCards.forEach(({ rank, suit }) => {
        const cardIndex = getCardIndex(rank, suit);

        cardStat[cardIndex] = cardStat[cardIndex] ?? {
          count: 0,
          ratio: 0,
        };

        cardStat[cardIndex].count++;
        cardStat[cardIndex].ratio = cardStat[cardIndex].count / (totalRounds * 9);
      });

      if (settlement[prev]) {
        occurrences++;
      } else {
        if (occurrences >= streakNumber) {
          stats.streaks.total++;
          stats.streaks[prev]++;

          if (occurrences >= longestStreak) {
            streaks[prev][occurrences] = streaks[prev][occurrences] ?? 0;
            streaks[prev][occurrences]++;
          }
        }

        prev = settlement.dealer ? 'dealer' : 'player';
        occurrences = 1;
      }

      Object.keys(settlement).reduce((choiceResults, choice) => {
        stats[choice] = stats[choice] ?? { count: 0, ratio: 0 };
        stats[choice].count += settlement[choice] ? 1 : 0;
        stats[choice].ratio = stats[choice].count / totalRounds;
      }, {});
    }
    console.log('*** NOTE: This statistic only run for current deal card flow');
    console.log(`======== Run ${totalRounds} rounds in mode ${mode} ========`);

    console.log(stats);
    console.log(`Longest streaks (>=${longestStreak}) in mode ${mode}: `);
    console.log(JSON.stringify(streaks, null, 2));
    console.log(`COMBINATION COUNT`);
    console.log(`Dealer :${JSON.stringify(combinationStats.dealer, null, 2)}`);
    console.log(`Player :${JSON.stringify(combinationStats.player, null, 2)}`);
    console.log(`CARD COUNT`);
    console.log(JSON.stringify(cardStat));
  });
});
