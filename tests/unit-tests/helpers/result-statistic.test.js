import { generateResult, getCardIndex, getSettlementResult } from '../../result-statistic';
import { randomModes } from '../../../src/helpers/deck-helper';
describe('Result statistic: 10000 times', () => {
  it.each(Object.keys(randomModes))(
    'statistic should have expected result with mode %d',
    (mode) => {
      // Arrange
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
      console.log(`======== Run ${totalRounds} rounds ========`);
      console.log(stats);
      console.log(`CARD COUNT`);
      console.log(JSON.stringify(cardStat));
      expect(stats['dealer'].ratio).toBeGreaterThanOrEqual(0.45);
      expect(stats['player'].ratio).toBeGreaterThanOrEqual(0.45);
      expect(stats['tie'].ratio).toBeGreaterThanOrEqual(0.03);
    },
  );
});
