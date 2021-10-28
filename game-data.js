import { Core } from "sc-game-base";

export class GameData extends Core.GameData {
    constructor(remainingTime) {
        super(remainingTime);

        this.currentMD5 = "";
        this.resultKey = "";
    }
}
