import { Core } from "sc-game-base";

export class GameData extends Core.GameData {
    constructor(remainingTime) {
        super(remainingTime);

        this.resultKey = { rawValue: "", formatValue: { cards: [], suffix: "" } };
        this.md5 = "";
    }
}
