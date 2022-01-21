import { currencyData } from "./stubs/test-data";

export const initUserSession = (user) => {
    return {
        session: `${user.memberId}-session-id`,
        ss: `${user.memberId}-session-id`,
        currency: currencyData.name,
        username: `${user.memberId}_${user.memberName}`,
        browserUserAgent: "browser-user-agent",
    };
};

export const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 10000;
export const WAITING_END_GAME_TIMEOUT = 6000;