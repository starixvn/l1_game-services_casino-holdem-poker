import UserHoldOrSwapConsumer from '../../../src/consumers/user-hold-or-swap-consumer';
import { helpers } from 'sc-common';

describe('UserHoldOrSwapConsumer', () => {
  const player = { profile: { name: 'player' } };
  const gameData = {
    ingame: {
      player: {
        betTracks: {},
      },
    },
  };

  describe('composeActionValidationCriteria', () => {
    let consumer = null;

    beforeEach(() => {
      consumer = new UserHoldOrSwapConsumer(null, gameData);
    });

    describe('when betTracks is not defined', () => {
      it('should return a criteria with failure value', async () => {
        // Arrange
        consumer.gameData.ingame.player = null;
        const expected = [{ failure: true, notice: helpers.noticeHelper.invalidBet }];

        // Act
        const result = await consumer.composeActionValidationCriteria(player);

        // Assert
        expect(result).toStrictEqual(expected);
      });
    });

    describe('when cannot swap', () => {
      it('should return a criteria with failure value', async () => {
        // Arrange
        consumer.gameData.ingame.player = { betTracks: { isSwappedOrHold: true } };
        const expected = [{ failure: true, notice: helpers.noticeHelper.invalidBet }];

        // Act
        const result = await consumer.composeActionValidationCriteria(player);

        // Assert
        expect(result).toStrictEqual(expected);
      });
    });

    describe('when can swap', () => {
      it('should return a falsy criteria', async () => {
        // Arrange
        consumer.gameData.ingame.player = { betTracks: { isSwappedOrHold: false } };
        const expected = [{ failure: false, notice: helpers.noticeHelper.invalidBet }];

        // Act
        const result = await consumer.composeActionValidationCriteria(player);

        // Assert
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe('consume', () => {
    let consumer = null;

    beforeEach(() => {
      consumer = new UserHoldOrSwapConsumer(null, gameData);
    });

    describe('when called', () => {
      it('should call parent method', async () => {
        // Arrange
        consumer.__proto__.__proto__.consume = jest.fn();

        // Act
        await consumer.consume(player, { action: 'swap' });

        // Assert
        expect(consumer.__proto__.__proto__.consume).toBeCalledWith(
          player,
          { action: 'swap' },
          { action: 'swap' },
        );
      });
    });
  });
});
