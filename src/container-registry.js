import awilix from 'awilix';
import { Table } from 'sc-game-base';

import { placeBet } from './apis/place-bet';
import {
  InGameConsumer,
  UserDealConsumer,
  UserDoubleCallConsumer,
  UserFoldConsumer,
  SettleGameConsumer,
  UserDisconnectConsumer,
} from './consumers';
import { GameCron, ProcessBetQueue, Bot } from './crons';
import { SocketRouter, HttpRouter } from './routes';
import HistoryQuery from './query-apis/history-query';
import { CasinoHoldemPokerBets, CasinoHoldemPokerRounds } from './models';
import { RoundResultPublisher } from "./publishers";

const { asClass, asValue } = awilix;

export default class ContainerRegistry extends Table.TableContainerRegistry {
  registerModels() {
    super.registerModels();

    this.container.register({
      roundsRepository: asValue(CasinoHoldemPokerRounds),
      betsRepository: asValue(CasinoHoldemPokerBets),
    });
  }

  registerCrons() {
    super.registerCrons();

    this.container.register({
      bot: asClass(Bot).singleton(),
      gameCron: asClass(GameCron).singleton().proxy(),
      processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
    });
  }

  registerConsumers() {
    super.registerConsumers();

    this.container.register({
      inGameConsumer: asClass(InGameConsumer).singleton(),
      settleGameRoundConsumer: asClass(SettleGameConsumer).singleton().proxy(),
      userDealConsumer: asClass(UserDealConsumer).singleton(),
      userDoubleCallConsumer: asClass(UserDoubleCallConsumer).singleton(),
      userFoldConsumer: asClass(UserFoldConsumer).singleton(),
      userDisconnectConsumer: asClass(UserDisconnectConsumer).singleton(),
    });
  }

  registerPublishers() {
    super.registerPublishers();

    this.container.register({
      roundResultPublisher: asClass(RoundResultPublisher).singleton(),
    });
  }

  registerApis() {
    super.registerApis();

    this.container.register({
      placeBet: asValue(placeBet),
      historyQuery: asClass(HistoryQuery).singleton(),
    });
  }

  registerRouters() {
    super.registerRouters();

    this.container.register({
      socketRouter: asClass(SocketRouter).proxy(),
      httpRouter: asClass(HttpRouter),
    });
  }
}
