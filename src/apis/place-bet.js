import { userInfos } from 'sc-base-database';
import { logger } from 'sc-common';

import { getCoinBalance } from 'sc-base-apis/src/get-balance';
import { apiResult, getFailedResponse, isErrorResult } from 'sc-base-apis/src/helpers';
import * as APIClient from 'sc-base-apis/src/api-client';

export const placeBet = async (user, betInfo) => {
  const session = user.session;
  const betAmount = betInfo.amount;

  if (betInfo.freeBet) {
    const balance = await getCoinBalance(user);
    if (!balance.isOk) {
      return balance;
    }

    if (balance.response.red < betAmount) {
      return apiResult({ isOk: false, response: { inSufficientScoin: true } });
    }
  }

  const placeBetParams = {
    SiteId: session.siteId,
    GameRoundId: betInfo.gameRoundId,
    GameTypeId: betInfo.gameId,
    ChoiceId: betInfo.choiceId,
    Amount: betInfo.freeBet ? 0 : betAmount,
    Currency: session.currency,
    ObCustId: session.memberId,
    Ip: session.ip,
    Language: session.language,
    System: session.system,
    RoundEndTime: betInfo.roundEndTime,
    FreeBet: betInfo.freeBet,
  };

  return placeBetWithValidAmount(user, betInfo, placeBetParams);
};

const placeBetWithValidAmount = async (user, betInfo, placeBetParams) => {
  const beforeMessage = logger.composeBeforeCallMessage(user.session, placeBetParams);
  const response = await APIClient.placeBet(placeBetParams, beforeMessage);

  if (isErrorResult(response)) {
    const extraFailedData = {
      gameTypeId: placeBetParams.GameTypeId,
      isPlaceBetFailed: true,
      gameRoundId: placeBetParams.GameRoundId,
    };

    return getFailedResponse(response, extraFailedData);
  }

  const scoinsIncrement = betInfo.freeBet ? { scoins: -betInfo.amount } : {};

  await userInfos.updateOne(
    { id: user.id },
    { $set: { red: response.balance }, $inc: scoinsIncrement },
  );

  return apiResult({
    isOk: true,
    response: {
      red: response.balance,
      scoins: (await getCoinBalance(user)).response.red,
    },
  });
};
