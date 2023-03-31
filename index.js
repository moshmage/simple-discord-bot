import dotenv from 'dotenv';

import {REST, Routes, Events, Client, GatewayIntentBits,} from 'discord.js';
import {FoF} from "./modules/fof.js";

dotenv.config();

const {CLIENT_ID, BOT_TOKEN} = process.env || {};

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions]});


async function setCommands(data, name) {
  try {
    console.log(`Setting commands`);
    const rest = new REST({version: '10'}).setToken(BOT_TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), {body: [data.toJSON()]});
    console.log(`Commands set for ${name}`)
  } catch (e) {
    console.error(`Failed to set commands for ${name}`, e);
  }
}

const modules = [new FoF(client),]


client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
  modules.forEach(m => setCommands(m.commandData, m.name))
});

client.on(Events.InteractionCreate, async interaction => {
  modules.forEach(m => {
    try {
      m.onInteractionCreate(interaction)
    } catch (e) {
      console.log(`Error on interaction with ${m.name}`, e, interaction);
    }
  });
});

(() => {
  return client.login(BOT_TOKEN);
})()
  .catch((e)=> {
    console.error(`Error`, e);
  });

