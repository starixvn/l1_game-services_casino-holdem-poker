import { GameData } from "../../game-data";
import { RoundResultPublisher } from "../round-result-publisher";

describe("round result publisher instance", () => {
    const gameData = new GameData();
    const gameName = "keno match";

    const publisher = new RoundResultPublisher(gameName, gameData);

    beforeEach(() => {
        spyOn(publisher, "publishToAllUsers");
        spyOn(publisher, "publishToAllAdmins");
    });

    it("publishMD5_should call specific methods", () => {
        // act
        publisher.publishMD5("md5");

        // assert
        expect(publisher.publishToAllUsers).toHaveBeenCalled();
        expect(publisher.publishToAllAdmins).toHaveBeenCalled();
    });

    it("publishFirstHalfResult_should call specific methods", () => {
        // act
        publisher.publishFirstHalfResult({});

        // assert
        expect(publisher.publishToAllUsers).toHaveBeenCalled();
        expect(publisher.publishToAllAdmins).toHaveBeenCalled();
    });
});
