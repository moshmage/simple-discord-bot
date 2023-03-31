import {SlashCommandBuilder} from "discord.js";

export default new SlashCommandBuilder()
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
    .setDescription(`See current average and total confidence votes for current channel`)
    .addNumberOption(o => o
      .setName(`days`)
      .setDescription(`Number of days check; (1 = today, default; 0 = all; 2 = last 2 days, etc)`)));