import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import SocketRouter from '../socket-router';

describe('Socket router test', () => {
  it('inherit BaseSocketRouter', () => {
    // Act
    const router = new SocketRouter({});

    // Assert
    expect(router instanceof BaseSocketRouter);
  });

  describe('init', () => {
    it('should run correctly', () => {
      // Arrange
      const router = new SocketRouter({});
      BaseSocketRouter.prototype.init = jest.fn();
      const socket = { on: jest.fn() };
      router.socketClient = socket;

      // Act
      router.init(socket);

      // Assert
      expect(BaseSocketRouter.prototype.init).toHaveBeenCalledWith(socket);
      expect(socket.on).toHaveBeenCalledWith('getTicketDetail', expect.any(Function));
    });
  });

  describe('handlePlaceBet', () => {
    it('should run correctly when verify false', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = { deal: {} };
      router.verify = jest.fn().mockReturnValue(false);
      router.userDealConsumer = { consume: jest.fn() };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.userDealConsumer.consume).not.toHaveBeenCalled();
    });

    it('should log error when have error', async () => {
      // Arrange
      const error = new Error('error');
      const router = new SocketRouter({});
      const payload = { deal: {} };
      router.verify = jest.fn(() => {
        throw error;
      });
      router.logService = { logError: jest.fn() };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.logService.logError).toHaveBeenCalledWith(error);
    });

    it('should call user deal when payload deal not null', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = { deal: { ante: 10 } };
      router.verify = jest.fn().mockReturnValue(true);
      router.userDealConsumer = { consume: jest.fn() };
      router.socketClient = { id: 1 };
      const realPlayer = { uid: 123 };
      router.gameData = { realPlayers: { 1: realPlayer } };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.userDealConsumer.consume).toHaveBeenCalledWith(realPlayer, payload.deal);
    });

    it('should call user fold when payload fold not null', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = { fold: {} };
      router.verify = jest.fn().mockReturnValue(true);
      router.userFoldConsumer = { consume: jest.fn() };
      router.socketClient = { id: 1 };
      const realPlayer = { uid: 123 };
      router.gameData = { realPlayers: { 1: realPlayer } };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.userFoldConsumer.consume).toHaveBeenCalledWith(realPlayer, payload);
    });

    it('should call user doubleCall when payload doubleCall not null', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = { doubleCall: {} };
      router.verify = jest.fn().mockReturnValue(true);
      router.userDoubleCallConsumer = { consume: jest.fn() };
      router.socketClient = { id: 1 };
      const realPlayer = { uid: 123 };
      router.gameData = { realPlayers: { 1: realPlayer } };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.userDoubleCallConsumer.consume).toHaveBeenCalledWith(realPlayer, payload);
    });

    it('should run correct when payload empty', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = {};
      router.verify = jest.fn().mockReturnValue(true);
      router.userDealConsumer = { consume: jest.fn() };
      router.userFoldConsumer = { consume: jest.fn() };
      router.userDoubleCallConsumer = { consume: jest.fn() };

      // Act
      await router.handlePlaceBet(payload);

      // Assert
      expect(router.userDealConsumer.consume).not.toHaveBeenCalled();
      expect(router.userFoldConsumer.consume).not.toHaveBeenCalled();
      expect(router.userDoubleCallConsumer.consume).not.toHaveBeenCalled();
    });
  });

  describe('handleGetTicketDetail', () => {
    it('should return run correct when verify false', () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = {};
      router.verify = jest.fn().mockReturnValue(false);
      router.historyQuery = { queryTicketDetail: jest.fn() };

      // Act
      router.handleGetTicketDetail(payload);

      // Assert
      expect(router.historyQuery.queryTicketDetail).not.toHaveBeenCalled();
    });

    it('should log error when have error', () => {
      // Arrange
      const error = new Error('error');
      const router = new SocketRouter({});
      const payload = { deal: {} };
      router.verify = jest.fn(() => {
        throw error;
      });
      router.logService = { logError: jest.fn() };

      // Act
      router.handleGetTicketDetail(payload);

      // Assert
      expect(router.logService.logError).toHaveBeenCalledWith(error);
    });

    it('should run correctly when verify true', async () => {
      // Arrange
      const router = new SocketRouter({});
      const payload = { roundId: 1 };
      router.verify = jest.fn().mockReturnValue(true);
      const ticketDetail = { ticketDetail: {} };
      router.historyQuery = { queryTicketDetail: jest.fn().mockReturnValue(ticketDetail) };
      router.socketClient = { id: 1, emit: jest.fn() };
      router.definition = { name: 'CasinoHoldemPoker' };
      const realPlayer = { uid: 123 };
      router.gameData = { realPlayers: { 1: realPlayer } };

      // Act
      await router.handleGetTicketDetail(payload);

      // Assert
      expect(router.socketClient.emit).toHaveBeenCalledWith(router.definition.name, ticketDetail);
    });
  });
});
