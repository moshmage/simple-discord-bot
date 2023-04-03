const fof = (msg = "") => `FoF: ${msg}`
export const HowConfident = fof`Fist of Five; How confident are you on the current sprint today?`;
export const VotingDisabled = fof`Disabled for this channel.`;
export const RepeatingMessageDisabled = (channel = "Unknown") => fof`Disabled repeating message for ${channel}`;
export const RepeatingMessageEvery = (minutes) => fof`Repeating message every ${minutes}`;
export const AlreadyEnabledForChosenChannel = fof`Already enabled for the chosen channel`;
export const VoteSaved = fof`Your vote was saved`;
export const WillPostOn = (channel = "") => fof`Will post on ${channel}`;
export const NothingToStop = fof`Nothing to stop`;
export const WrongArgument = fof`Wrong argument.`;
export const MissingArgument = fof`Missing argument.`;
export const NoVotesOnWeekend = fof`No votes on weekend`;
export const AveragesToOutOf = (avg = 0, total = 0, days = -1) =>
  fof`Overall confidence averages to ${avg} out of ${total} votes.`;
export const AveragesToOutOfDays = (avg, total, days) =>
  [days === 0 ? `Out of all records,` : `On the last ${days} days,`, AveragesToOutOf(avg, total).toLowerCase()].join(` `)