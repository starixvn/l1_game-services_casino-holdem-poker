import { userInfos } from 'sc-base-database';
import { logger } from 'sc-common';
import { apiResult, getFailedResponse, isErrorResult } from 'sc-base-apis/src/helpers';
import { getCoinBalance } from 'sc-base-apis/src/get-balance';
import * as APIClient from 'sc-base-apis/src/api-client';
import { placeBet } from '../place-bet';

jest.mock('sc-common');
jest.mock('sc-base-database');
jest.mock('sc-base-apis/src/get-balance', () => {
  return { getCoinBalance: jest.fn() };
});
jest.mock('sc-base-apis/src/helpers');
jest.mock('sc-base-apis/src/api-client', () => {
  return { placeBet: jest.fn() };
});

describe('place-bet test', () => {
  describe('when freeBet true', () => {
    const betInfo = { amount: 10, freeBet: true };

    it('should return balance when getCoinBalance fail', async () => {
      // Arrange
      const balance = { isOk: false, response: '' };
      getCoinBalance.mockReturnValue(balance);

      // Act
      const actual = await placeBet({}, betInfo);

      // Assert
      expect(actual).toStrictEqual(balance);
    });
    it('should return inSufficientScoin when red less than betAmount', async () => {
      // Arrange
      const balance = { isOk: true, response: { red: 1 } };
      getCoinBalance.mockReturnValue(balance);
      const expected = apiResult({ isOk: false, response: { inSufficientScoin: true } });

      // Act
      const actual = await placeBet({}, betInfo);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when place bet successfully', async () => {
      // Arrange
      const bet = {
        gameRoundId: 1,
        gameId: 1,
        choiceId: 1,
        amount: 10,
        freeBet: true,
        roundEndTime: '',
      };
      const session = { siteId: 123, currency: 'IN', memberId: 1, ip: '', language: 'en' };
      const placeBetParams = {
        SiteId: session.siteId,
        GameRoundId: bet.gameRoundId,
        GameTypeId: bet.gameId,
        ChoiceId: bet.choiceId,
        Amount: 0,
        Currency: session.currency,
        ObCustId: session.memberId,
        Ip: session.ip,
        Language: session.language,
        RoundEndTime: bet.roundEndTime,
        FreeBet: bet.freeBet,
      };
      const balance = { isOk: true, response: { red: 1000 } };
      getCoinBalance.mockReturnValue(balance);
      logger.composeBeforeCallMessage.mockReturnValue({});
      APIClient.placeBet.mockReturnValue({ balance: 100 });
      isErrorResult.mockReturnValue(false);
      const expected = apiResult({
        isOk: true,
        response: { red: 100, scoins: balance.response.red },
      });

      // Act
      const actual = await placeBet({ id: 1, session }, bet);

      // Assert
      expect(logger.composeBeforeCallMessage).toHaveBeenCalledWith(session, placeBetParams);
      expect(APIClient.placeBet).toHaveBeenCalledWith(placeBetParams, {});
      expect(userInfos.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { red: 100 }, $inc: { scoins: -10 } },
      );
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('when freeBet false', () => {
    const betInfo = {
      gameRoundId: 1,
      gameId: 1,
      choiceId: 1,
      amount: 10,
      freeBet: false,
      roundEndTime: '',
    };
    const session = { siteId: 123, currency: 'IN', memberId: 1, ip: '', language: 'en' };
    const placeBetParams = {
      SiteId: session.siteId,
      GameRoundId: betInfo.gameRoundId,
      GameTypeId: betInfo.gameId,
      ChoiceId: betInfo.choiceId,
      Amount: betInfo.amount,
      Currency: session.currency,
      ObCustId: session.memberId,
      Ip: session.ip,
      Language: session.language,
      RoundEndTime: betInfo.roundEndTime,
      FreeBet: betInfo.freeBet,
    };
    const balance = 100;
    beforeAll(() => {
      logger.composeBeforeCallMessage.mockReturnValue({});
      APIClient.placeBet.mockReturnValue({ balance });
    });

    it('should return failed expected when place bet unsuccessfully', async () => {
      // Arrange
      isErrorResult.mockReturnValue(true);
      const extraFailedData = {
        gameTypeId: placeBetParams.GameTypeId,
        isPlaceBetFailed: true,
        gameRoundId: placeBetParams.GameRoundId,
      };
      const expected = getFailedResponse({ balance }, extraFailedData);

      // Act
      const actual = await placeBet({ session }, betInfo);

      // Assert
      expect(logger.composeBeforeCallMessage).toHaveBeenCalledWith(session, placeBetParams);
      expect(APIClient.placeBet).toHaveBeenCalledWith(placeBetParams, {});
      expect(actual).toStrictEqual(expected);
    });

    it('should return failed expected when place bet unsuccessfully', async () => {
      isErrorResult.mockReturnValue(false);
      getCoinBalance.mockReturnValue({ response: { red: 0 } });
      const expected = apiResult({
        isOk: true,
        response: { red: balance, scoins: 0 },
      });

      // Act
      const actual = await placeBet({ id: 1, session }, betInfo);

      // Assert
      expect(logger.composeBeforeCallMessage).toHaveBeenCalledWith(session, placeBetParams);
      expect(APIClient.placeBet).toHaveBeenCalledWith(placeBetParams, {});
      expect(userInfos.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { red: balance }, $inc: {} },
      );
      expect(actual).toStrictEqual(expected);
    });
  });
});
