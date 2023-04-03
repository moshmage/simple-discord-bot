import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";

export default [
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