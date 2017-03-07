import Discord = require('discord.js');
const client = new Discord.Client();

import {emojifaceify} from './emojifaceify';

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (message: Discord.Message) => {
    emojifaceify(message);
});

client.login('Mjg4NTMzNjc0MTAwNjU0MDgw.C5_RmA.uRZzzAmen4cGo2LBc6Nk_EMJwxU');
