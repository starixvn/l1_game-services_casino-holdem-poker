import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';
import HttpRouter from '../http-router';

jest.mock('sc-common');
describe('Http Router test', () => {
  it('inherit TableHttpRouter', () => {
    // Act
    const router = new HttpRouter();

    // Assert
    expect(router instanceof TableHttpRouter);
  });

  describe('init', () => {
    it('should run correct', () => {
      // Arrange
      const router = new HttpRouter();
      const app = { post: jest.fn() };
      const fn = jest.fn();
      router.handleSetResult = jest.fn().mockReturnValue(fn);
      TableHttpRouter.prototype.init = jest.fn();

      // Act
      router.init(app);

      // Assert
      expect(TableHttpRouter.prototype.init).toHaveBeenCalledWith(app);
      expect(app.post).toHaveBeenCalledWith('/set-result', fn);
    });
  });

  describe('handleSetResult', () => {
    it('should send status 404 when env is UAT', () => {
      // Arrange
      const router = new HttpRouter();
      router.appConfigs = { env: 'UAT' };
      const res = { sendStatus: jest.fn() };
      const fn = router.handleSetResult();

      // Act
      fn({}, res);

      // Assert
      expect(res.sendStatus).toHaveBeenCalledWith(404);
    });

    it('should run correctly when env is LOCAL', () => {
      // Arrange
      const router = new HttpRouter();
      router.appConfigs = { env: 'LOCAL' };
      const res = { send: jest.fn() };
      const req = { body: { dealer: [] } };
      router.gameData = { resultFromAdmin: {} };
      const fn = router.handleSetResult();

      // Act
      fn(req, res);

      // Assert
      expect(router.gameData.resultFromAdmin).toStrictEqual(req.body);
      expect(logger.logWarning).toHaveBeenCalledWith(
        `Set result from api: ${JSON.stringify(router.gameData.resultFromAdmin)}`,
      );
      expect(res.send).toHaveBeenCalledWith({ success: true });
    });
  });
});
