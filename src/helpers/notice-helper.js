import { helpers } from 'sc-common';

const extraNotice = {
    invalidDealDueToRunningRound: "SB1923",
}

export default Object.assign({}, helpers.noticeHelper, extraNotice);
