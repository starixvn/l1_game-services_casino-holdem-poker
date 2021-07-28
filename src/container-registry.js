import awilix from 'awilix';
import { Table } from 'sc-game-base';

import { placeBet } from './apis/place-bet';
import { PlaceBetPublisher } from 'sc-game-base/src/core/event-publishers';
import {
  GetGameConfigsConsumer,
  ChangeLanguageConsumer,
  TableUserSignInConsumer,
} from '@nex3/nex3-game-base/consumers';
import { InGameConsumer } from './consumers';
import { GameCron } from './crons';
import { AdminSocketRouter, TableSocketRouter } from '@nex3/nex3-game-base/routes';
import { CasinoHoldemPokerBets, CasinoHoldemPokerRounds } from './models';

const { asClass, asValue } = awilix;

export default class ContainrRegistry extends Table.TableContainerRegistry {
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
      gameCron: asClass(GameCron).singleton().proxy(),
    });
  }

  registerConsumers() {
    super.registerConsumers();

    this.container.register({
      inGameConsumer: asClass(InGameConsumer).singleton(),
      userSignInConsumer: asClass(TableUserSignInConsumer).singleton(),
      changeLanguageConsumer: asClass(ChangeLanguageConsumer).singleton(),
      getGameConfigsConsumer: asClass(GetGameConfigsConsumer).singleton().proxy(),
    });
  }

  registerPublishers() {
    super.registerPublishers();

    this.container.register({
      placeBetPublisher: asClass(PlaceBetPublisher).singleton(),
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
      adminSocketRouter: asClass(AdminSocketRouter).proxy(),
      socketRouter: asClass(TableSocketRouter).proxy(),
    });
  }
}
