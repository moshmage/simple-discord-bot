import {ChannelRows, ChannelTimers, ChannelVotes, DailyChannelResults, RepeaterTimers} from "./fof/memory-base.js";
import VoteRows from "./fof/vote-rows.js";
import {
  AlreadyEnabledForChosenChannel,
  AveragesToOutOf,
  AveragesToOutOfDays, HowConfident,
  MissingArgument,
  NothingToStop,
  NoVotesOnWeekend,
  RepeatingMessageDisabled,
  RepeatingMessageEvery,
  VoteSaved,
  VotingDisabled,
  WillPostOn,
  WrongArgument
} from "./fof/messages.js";
import {isWeekend} from "date-fns";
import command from "./fof/command.js";

export class FoF {
  name = `Fist of Five`;

  /**
   * @type {import('discord.js').Client}
   */
  client;
  commandData = command;

  constructor(client) {
    this.client = client;
  }

  /**
   * @param {number[]} values
   * @return {{average: number, values: number[], total: number}}
   */
  count(values = []) {
    return {average: values.reduce((p, c) => p + c, 0) / values.length, values, total: values.length}
  }

  async sendRowsToChannel(channel) {
    if (ChannelRows[channel.id])
      await ChannelRows[channel.id].delete();

    ChannelRows[channel.id] =
      await this.client.channels.cache.get(channel.id).send({content: HowConfident, components: VoteRows})
  }

  async sendVoteCountToChannel(channel) {
    const {average, total} = this.count(Object.values(ChannelVotes[channel.id]))
    return this.client.channels.cache.get(channel.id).send({content: AveragesToOutOf(average, total)});
  }

  async repeatLogic(interaction, channel) {

    const _startRepeatTimer = (minutes) =>
      RepeaterTimers[channel.id] =
        setTimeout(async () => {
          if (!isWeekend(new Date()))
            await this.sendRowsToChannel(channel);
          if (RepeaterTimers[channel.id])
            _startRepeatTimer();
        }, minutes * 60 * 1000);

    const _stopRepeatTimer = () => {
      clearTimeout(RepeaterTimers[channel.id]);
      RepeaterTimers[channel.id] = null;
    }

    if (interaction.options.getBoolean(`off`) && ChannelTimers[channel.id]) {
      _stopRepeatTimer();
      return interaction.reply({content: RepeatingMessageDisabled(channel.name)})
    } else if (interaction.options.getNumber(`minutes`)) {
      const minutes = interaction.options.getNumber(`minutes`);
      _startRepeatTimer(minutes);
      return interaction.reply({content: RepeatingMessageEvery(minutes)})
    }

    return interaction.reply({content: WrongArgument, ephemeral: true});
  }

  async startLogic(channel) {

    const _startLogic = async (repeating = false, _wasCalledOnWeekend = false) => {
      if (!_wasCalledOnWeekend) {
        if (repeating)
          await this.sendVoteCountToChannel(channel);
        await this.sendRowsToChannel(channel);

        DailyChannelResults[channel.id] = {
          ... (DailyChannelResults[channel.id] || {}),
          [new Date().toISOString()]: this.count(Object.values(ChannelVotes[channel.id]))
        }

        ChannelVotes[channel.id] = {};
      }

      return _startLogic(true, isWeekend(new Date()));
    }

    if (!ChannelTimers[channel.id])
      _startLogic(false, isWeekend(new Date()));

    ChannelTimers[channel.id] =
      setTimeout(() => {
        _startLogic(true, isWeekend(new Date()))
      }, 24 * 60 * 60 * 1000);
  }

  async stopLogic(channel) {
    await this.sendVoteCountToChannel(channel);

    clearTimeout(ChannelTimers[channel.id]);

    ChannelTimers[channel.id] = null;
    ChannelVotes[channel.id] = {};
    ChannelRows[channel.id]?.delete();
    ChannelRows[channel.id] = null;
  }

  async stopCommand(interaction, channel) {
    if (!ChannelTimers[channel?.id || interaction.channel.id])
      return interaction.reply({content: NothingToStop, ephemeral: true});

    await this.stopLogic(channel);

    return interaction.reply({content: VotingDisabled});
  }

  async startCommand(interaction, channel) {
    if (ChannelTimers[channel.id])
      return interaction.reply({content: AlreadyEnabledForChosenChannel});

    await interaction.reply({content: WillPostOn(channel.name), ephemeral: true});
    await this.startLogic(channel);
  }

  async voteCommand(interaction) {
    if (isWeekend(new Date()))
      return interaction.reply({content: NoVotesOnWeekend, ephemeral: true});

    if (!interaction.customId)
      return interaction.reply({content: MissingArgument, ephemeral: true});

    const [command, value] = interaction.customId.split(':');

    if (command !== `vote`)
      return interaction.reply({content: WrongArgument, ephemeral: true});

    ChannelVotes[interaction.channel.id] = {
      ...(ChannelVotes[interaction.channel.id] || {}),
      [interaction.member.id]: +value
    };

    return interaction.reply({content: VoteSaved, ephemeral: true})
  }

  async countCommand(interaction) {
    let days = interaction.options.getNumber(`days`);
    days = days === null && 1 || days;

    if (days === 1 && !isWeekend(new Date())) {
      const {average, total} = this.count(Object.values(ChannelVotes[interaction.channel.id]));
      return interaction.reply({content: AveragesToOutOf(average, total), ephemeral: true});
    }

    const {average, total} =
      this.count(Object.values(DailyChannelResults[interaction.channel.id]).slice(-days).map(({values}) => values).flat());
    return interaction.reply({content: AveragesToOutOfDays(average, total, days)})
  }

  async repeatCommand(interaction, channel) {
    return this.repeatLogic(interaction, channel || interaction.channel);
  }

  async onCommandInteraction(interaction) {
    if (interaction.commandName !== `fof`)
      return;

    const channel = interaction.options.getChannel(`channel`);

    if (interaction.options.getSubcommand() === "repeat")
      return this.repeatCommand(interaction, channel)

    if (interaction.options.getSubcommand() === `start`) {
      return this.startCommand(interaction, channel)
    }

    if (interaction.options.getSubcommand() === `count`)
      return this.countCommand(interaction);

    if (interaction.options.getSubcommand() === `stop`)
      return this.stopCommand(interaction);

    return interaction.reply({content: WrongArgument});
  }

  /**
   * @param {import('discord.js').Interaction} interaction
   * @return {Promise<*|undefined>}
   */
  async onInteractionCreate(interaction) {
    if (interaction.isCommand())
      return this.onCommandInteraction(interaction);
    else if (interaction.isButton())
      return this.voteCommand(interaction);
  }
}