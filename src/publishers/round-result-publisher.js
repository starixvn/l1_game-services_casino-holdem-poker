import { Core } from "sc-game-base";

export class RoundResultPublisher extends Core.BaseEventPublishers.RoundResultPublisher {
    publishMD5(md5) {
        const payload = { md5 };
        this.publishToAllUsers(payload);
        this.publishToAllAdmins(payload);
    }

    publishFirstHalfResult(result) {
        const payload = { firstHalfResult: result };
        this.publishToAllUsers(payload);
        this.publishToAllAdmins(payload);
    }
}
