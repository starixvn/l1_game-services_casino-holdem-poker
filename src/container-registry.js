import awilix from 'awilix';
import { Table } from 'sc-game-base';

import { placeBet } from './apis/place-bet';
import {
  GetGameConfigsConsumer,
  ChangeLanguageConsumer,
  TableUserSignInConsumer,
} from '@nex3/nex3-game-base/consumers';
import {
  InGameConsumer,
  UserDealConsumer,
  UserCallConsumer,
  UserDoubleCallConsumer,
  UserFoldConsumer,
  SettleGameConsumer,
  UserDisconnectConsumer,
} from './consumers';
import { GameCron, ProcessBetQueue, Bot } from './crons';
import { SocketRouter, HttpRouter } from './routes';
import { CasinoHoldemPokerBets, CasinoHoldemPokerRounds } from './models';

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
      userSignInConsumer: asClass(TableUserSignInConsumer).singleton(),
      changeLanguageConsumer: asClass(ChangeLanguageConsumer).singleton(),
      getGameConfigsConsumer: asClass(GetGameConfigsConsumer).singleton().proxy(),
      userDealConsumer: asClass(UserDealConsumer).singleton(),
      userCallConsumer: asClass(UserCallConsumer).singleton(),
      userDoubleCallConsumer: asClass(UserDoubleCallConsumer).singleton(),
      userFoldConsumer: asClass(UserFoldConsumer).singleton(),
      userDisconnectConsumer: asClass(UserDisconnectConsumer).singleton(),
    });
  }

  registerApis() {
    super.registerApis();

    this.container.register({
      placeBet: asValue(placeBet),
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
