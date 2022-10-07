import { currencyData } from './stubs/test-data';

export const initUserSession = (user) => {
  return {
    session: `${user.playerId}-session-id`,
    ss: `${user.playerId}-session-id`,
    currency: currencyData.name,
    username: `${user.playerId}_${user.playerName}`,
    browserUserAgent: 'browser-user-agent',
  };
};

export const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 10000;
export const WAITING_END_GAME_TIMEOUT = 6000;
