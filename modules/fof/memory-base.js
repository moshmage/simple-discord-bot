/**
 * @type {{[channelId: string]: number|null}}
 */
export const ChannelTimers = {};
export const RepeaterTimers = {};

/**
 * @type {{[channelId: string]: {[memberId: string]: number}}}
 */
export const ChannelVotes = {};

/**
 * @type {{[channelId: string]: {[date: string]: {average: number, values: number[]}}}}
 */
export const DailyChannelResults = {};

export const ChannelRows = {};
