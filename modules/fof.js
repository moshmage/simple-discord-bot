import {ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder} from "discord.js";

export class FoF {
  name = "Fist of Five";
  #client;

  constructor(client) {
    this.#client = client;
  }

  Reminders = {};
  FoFVotes = {};
  Timers = {};

  commandData = new SlashCommandBuilder()
    .setName(`fof`)
    .setDescription(`Fist of Five`)
    .addSubcommand(s => s
      .setName(`start`)
      .setDescription(`Start FoF on chosen channel`)
      .addChannelOption(o => o
        .setName(`channel`)
        .setDescription(`Choose channel to start FoF`)
        .setRequired(true)))
    .addSubcommand(s => s
      .setName(`stop`)
      .setDescription(`Stop fof on chosen channel`)
      .addChannelOption(o => o
        .setName(`channel`)
        .setDescription(`Choose channel to stop FoF`)))
    .addSubcommand(s => s
      .setName(`repeat`)
      .setDescription(`Configure repeat options for channel`)
      .addChannelOption(o => o
        .setName(`channel`)
        .setDescription(`On what channel`)
        .setRequired(true))
      .addNumberOption(o => o
        .setName(`minutes`)
        .setDescription(`Choose amount of minutes to wait before showing results and restarting`))
      .addBooleanOption(o => o
        .setName(`off`)
        .setDescription(`turn off repeat, aka never-ending-post-once`)))
    .addSubcommand(s => s
      .setName(`count`)
      .setDescription(`See current average and total confidence votes for current channel`));

  #voteButtonRows = [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`vote:0`)
          .setLabel(`None. Nill. Zero.`)
          .setStyle(ButtonStyle.Secondary)),
    new ActionRowBuilder()
      .addComponents(
        [1, 2, 3, 4, 5]
          .map(n =>
            new ButtonBuilder()
              .setCustomId(`vote:${n}`)
              .setLabel(n.toString())
              .setStyle(ButtonStyle.Secondary)))
  ]

  countVotes(channelId) {
    if (!this.FoFVotes[channelId])
      return {votes: 0, total: 0};

    const values = Object.values(this.FoFVotes[channelId]).filter(v => typeof v === "number")
    const total = values.length;

    return {votes: values.reduce((p, c) => +p + +c, 0) / total, total};
  }

  votesCountMessage(channelId) {
    const {votes, total} = this.countVotes(channelId);
    return `Overall confidence averages to ${votes} out of ${total} votes`;
  }

  sendVoteCountToChannel(channelId) {
    return this.#client.channels.cache.get(channelId).send({content: this.votesCountMessage(channelId)});
  }

  async sendRowsToChannel(channelId) {
    return this.#client
      .channels.cache
      .get(channelId)
      .send({
        content: `Fist of Five; How confident are you on the current sprint today?`,
        components: this.#voteButtonRows
      })
  }

  async startFofVote(channel) {
    await this.sendRowsToChannel(channel.id);
    this.FoFVotes[channel.id] = {startedAt: new Date()};
    this.Timers[channel.id] =
      setTimeout(() => {
        this.sendVoteCountToChannel(channel.id);
        this.startFofVote(channel);
      }, 24 * 60 * 60 * 1000) // 24hours
  }

  async stopFofVote(channel) {
    await this.sendVoteCountToChannel(channel);
    await this.#client.channels.cache.get(channel).send({content: `FoF: Voting was turned off`});
    clearTimeout(this.Timers[channel]);
    this.Timers[channel] = null;
    this.FoFVotes[channel] = {};
  }

  async configSayReminder(interaction, channel) {

    const sayReminder = (channelId, minutes) => {
      this.Reminders[channelId] =
        setTimeout(async () => {
          await this.sendRowsToChannel(channelId);
          if (this.Reminders[channelId])
            sayReminder(channelId, minutes);
        }, minutes * 60 * 1000)
    }

    const setTimerOff = (channelId) => {
      clearTimeout(this.Reminders[channelId]);
      this.Reminders[channelId] = null;
    }

    if (interaction.options.getBoolean(`off`) && this.Reminders[channel.id]) {
      setTimerOff(channel.id);
      interaction.reply(`Turned off repeating message for ${channel.name}`);
    } else if (interaction.options.getNumber(`minutes`)) {
      const minutes = interaction.options.getNumber(`minutes`);
      sayReminder(channel.id, minutes);
      interaction.reply(`Set repeating message every ${minutes}min`);
    }
  }

  async onInteractionCreate(interaction) {
    if (interaction.isCommand())
      return this.onCommandInteraction(interaction);
    else if (interaction.isButton())
      return this.onButtonInteraction(interaction);
  }

  async onButtonInteraction(interaction) {
    if (interaction.customId) {
      const [command, value] = interaction.customId.split(':');
      if (command !== `vote`)
        return;

      if (!this.FoFVotes[interaction.channel.id])
        this.FoFVotes[interaction.channel.id] = {};

      if (!this.FoFVotes[interaction.channel.id]?.startedAt)
        return interaction.reply({content: `Fof is not enabled for this channel`});

      if (this.FoFVotes[interaction.channel.id][interaction.member.id] !== undefined)
        await interaction.reply({content: `Your vote was changed, still secret`, ephemeral: true});
      else
        await interaction.reply({content: `Your vote is secret, but it was saved`, ephemeral: true});

      this.FoFVotes[interaction.channel.id][interaction.member.id] = +value;
    } else await interaction.reply({content: `Missing argument?`, ephemeral: true});
  }
  
  async onCommandInteraction(interaction) {
    if (interaction.commandName !== `fof`)
      return;
    
    const channel = interaction.options.getChannel(`channel`);

    if (interaction.options.getSubcommand() === "repeat")
      return this.configSayReminder(interaction, channel)

    if (interaction.options.getSubcommand() === `start`) {
      if (this.FoFVotes[channel.id]?.startedAt)
        return interaction.reply({content: `FoF already enabled on the chosen channel`, ephemeral: true})

      await interaction.reply({content: `Will post on ${channel.name}`, ephemeral: true});
      await this.startFofVote(channel);
    }

    if (interaction.options.getSubcommand() === `count`)
      await interaction.reply({content: this.votesCountMessage(interaction.channel.id)});

    if (interaction.options.getSubcommand() === `stop`) {
      if (!this.FoFVotes[channel?.id || interaction.channel.id]?.startedAt)
        return interaction.reply({content: `Nothing to stop`, ephemeral: true});

      await this.stopFofVote(channel?.id || interaction.channel.id);
      await interaction.reply({content: `Ok`, ephemeral: true});
    }

    
  }
}