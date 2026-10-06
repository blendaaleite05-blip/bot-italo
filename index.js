const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');

// ==============================
// MINI SITE PARA O RENDER
// ==============================

const app = express();

app.get('/', (req, res) => {
    res.send('Online');
});

app.listen(3000, () => {
    console.log('Servidor web online na porta 3000');
});

// ==============================
// CONFIGURAÇÃO DO BOT
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ==============================
// DADOS DO BOT
// ==============================

const TOKEN = process.env.DISCORD_TOKEN;

const CANAL_VOZ_ID = '1432433480004014150';
const SERVIDOR_ID = '920817412050403399';

const YOUTUBE_URL = 'https://youtube.com/@italosilva';

// ==============================
// QUANDO O BOT ESTIVER PRONTO
// ==============================

client.once('clientReady', async () => {

    console.log(`Bot conectado como ${client.user.tag}`);

    // ==============================
    // STATUS DE TRANSMISSÃO
    // ==============================

    client.user.setPresence({
        activities: [{
            name: '🔴 LIVE ON - ITALO SILVA',
            type: 1,
            url: YOUTUBE_URL
        }],
        status: 'online'
    });

    console.log('Status de transmissão ativado.');

    // ==============================
    // ENTRAR AUTOMATICAMENTE NA CALL
    // ==============================

    try {

        const guild = await client.guilds.fetch(SERVIDOR_ID);

        console.log(`Servidor encontrado: ${guild.name}`);

        const channel = await guild.channels.fetch(CANAL_VOZ_ID);

        if (!channel) {
            console.error('Canal de voz não encontrado.');
            return;
        }

        if (!channel.isVoiceBased()) {
            console.error('O ID informado não pertence a um canal de voz.');
            return;
        }

        console.log(`Canal encontrado: ${channel.name}`);

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: false,
            selfDeaf: false
        });

        console.log('Bot entrou na call.');

    } catch (error) {

        console.error('ERRO AO ENTRAR NA CALL:');
        console.error(error);

    }

});

// ==============================
// LOGIN DO BOT
// ==============================

client.login(TOKEN);
