import { Core, Table } from 'sc-game-base';
import appConfigs from "./app-configs";
import gameSettings from './game-settings';
import { generateResult, getSettleResult } from './helpers/result-helper';
import ContainerRegistry from './container-registry';

const run = async () => {
  const definition = new Core.GameDefinition(gameSettings, generateResult, getSettleResult);
  const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);
  const container = new ContainerRegistry().register(appConfigs, definition, gameData);

  const app = new Core.BaseGameApp("Casino Holdem Poker", appConfigs);
  await app.run();
  app.startGame(container);
};

run();
