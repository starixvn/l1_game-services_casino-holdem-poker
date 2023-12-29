import { Core, Table } from 'sc-game-base';
import { initAPIStub, stubUserService } from 'sc-game-service-integration-utils';

import appConfigs from '../../../src/app-configs.IGT';
import gameSettings from '../../../src/game-settings';
import { generateResult, getSettleResult } from '../../../src/helpers/result-helper';
import ContainerRegistry from '../../../src/container-registry';

export const run = async () => {
  initAPIStub(appConfigs.apiSettings.apiUrl);
  stubUserService(appConfigs);

  const definition = new Core.GameDefinition(gameSettings, generateResult, getSettleResult);
  const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);
  const container = new ContainerRegistry().register(appConfigs, definition, gameData);

  const app = new Core.BaseGameApp('Casino Holdem Poker', appConfigs);
  await app.run();
  app.startGame(container);
};

run();
