import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';
import HttpRouter from '../../../src/routes/http-router';
import { isQualified } from '../../../src/helpers/result-helper';
import BaseEventPublishers from 'sc-game-base/src/core/event-publishers/base-event-publisher';

jest.mock('sc-common');
jest.mock('sc-base-database');
jest.mock('../../../src/helpers/result-helper');
/** @type {mongoose.Model}*/

const publisher = new BaseEventPublishers();
const gameNotificationsRepository = {
  deleteOne: jest.fn()
};
describe('Http Router test', () => {
  const app = {
    get: jest.fn(),
    post: (url, authenticate, callBack) => {
      callBack && callBack({}, { send: jest.fn() });
    },
    calledPost: false,
  };
  const appConfigs = {
    apiSettings: {
      authUrl: 'http://localhost',
    },
    authenticateSettings: {
      audiences: [],
    },
  };
  const logService = {};
  const gameData = {};
  const historyQuery = {};
  const metricQuery = {};

  let router;
  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    router = new HttpRouter(appConfigs, gameData, historyQuery, metricQuery, logService);
  });
  it('inherit TableHttpRouter', () => {
    // Assert
    expect(router instanceof TableHttpRouter);
  });

  describe('init', () => {
    it('should run correct', () => {
      // Arrange
      app.calledPost = false;
      TableHttpRouter.prototype.init = jest.fn();
      router.handleVoidTicket = jest.fn();
      router.handleSetResult = jest.fn();
      TableHttpRouter.prototype.init = jest.fn();

      // Act
      router.init(app);

      // Assert
      expect(TableHttpRouter.prototype.init).toHaveBeenCalledWith(app);
      expect(router.handleSetResult).toHaveBeenCalled();
      expect(router.handleVoidTicket).toHaveBeenCalled();
    });
  });

  describe('handleSetResult', () => {
    it('should send status 404 when env is UAT', () => {
      // Arrange
      const appConfigs = { sentry: { env: 'UAT' } };
      const router = new HttpRouter(appConfigs);
      const res = { sendStatus: jest.fn() };
      const fn = router.handleSetResult();
      isQualified.mockReturnValue(false);

      // Act
      fn({}, res);

      // Assert
      expect(res.sendStatus).toHaveBeenCalledWith(404);
    });

    it('should run correctly when env is LOCAL', () => {
      // Arrange
      const appConfigs = { sentry: { env: 'LOCAL' } };
      const router = new HttpRouter(appConfigs);
      const res = { send: jest.fn() };
      const req = {
        body: {
          "nickname": "Aqua64842",
          "player": [
            {
              "suit": 0,
              "rank": 2
            },
            {
              "suit": 1,
              "rank": 2
            },
          ],
          "dealer": [
            {
              "suit": 1,
              "rank": 3
            },
            {
              "suit": 2,
              "rank": 3
            },
          ],
          "communityCards": [
            {
              "suit": 2,
              "rank": 4
            },
            {
              "suit": 2,
              "rank": 5
            },
            {
              "suit": 2,
              "rank": 6
            },
            {
              "suit": 3,
              "rank": 5
            },
            {
              "suit": 3,
              "rank": 4
            },
          ],
        },
      };
      router.gameData = { resultFromAdmin: {} };
      router.definition = { settle: jest.fn() };

      const fn = router.handleSetResult();

      // Act
      fn(req, res);

      // Assert
      expect(router.gameData.resultFromAdmin).toStrictEqual(req.body);
      expect(logger.logError).toHaveBeenCalledWith(
        `Set result from api: ${JSON.stringify(router.gameData.resultFromAdmin)}`,
      );
    });
  });

  describe('handleVoidTicket', () => {
    it('should run correctly when player is valid', async () => {
      // Arrange
      const realPlayer = { UID: 'abc', profile: { name: 'a' } };
      const gameData = {
        ingame: { [realPlayer.profile.name]: {} },
        gameConfigs: { odds: {} },
        realPlayers: { 1: realPlayer },
      };
      const definition = { settle: jest.fn() };
      const router = new HttpRouter(null, gameData, null, null, null, null, definition, publisher, gameNotificationsRepository);
      const res = { send: jest.fn() };
      const req = {
        body: {
          UserIdentify: 'abc',
          Name: 'a',
        },
      };
  
      publisher.publishToUser = jest.fn();
      //Act
      await router.handleVoidTicket(req, res);

      // Assert
      expect(router.gameData.ingame).toStrictEqual({});
      expect(gameNotificationsRepository.deleteOne).toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        `Void running ticket from api call for ${JSON.stringify('a')}`,
      );
      expect(publisher.publishToUser).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(true);
    });

    it('should run incorrectly when player is invalid', async () => {
      // Arrange
      const realPlayer = { UID: 'bc', profile: { name: 'a' } };
      const gameData = {
        ingame: { [realPlayer.profile.name]: {} },
        gameConfigs: { odds: {} },
        realPlayers: { 1: realPlayer },
      };
      const definition = { settle: jest.fn() };
      const router = new HttpRouter(null, gameData, null, null, null, null, definition);
      const res = { send: jest.fn() };
      const req = {
        body: {
          UserIdentify: 'abc',
        },
      };
     
      await router.handleVoidTicket(req, res);

      // Assert
      expect(router.gameData.ingame).toStrictEqual({ [realPlayer.profile.name]: {} });
      expect(logger.logError).toHaveBeenCalledWith(`Player not found`);
      expect(res.send).toHaveBeenCalledWith(false);
    });
  });
});
