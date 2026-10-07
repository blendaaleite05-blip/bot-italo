const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

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
const YOUTUBE_API = process.env.YOUTUBE_API;

// ==============================
// CALL
// ==============================

const CANAL_VOZ_ID = '1432433480004014150';
const SERVIDOR_ID = '920817412050403399';

// ==============================
// YOUTUBE
// ==============================

const CANAL_NOTIFICACAO_ID = '1101866650392875109';

const YOUTUBE_CHANNEL_ID = 'UCS99u5HTSzbyhXczC19EOpg';

const YOUTUBE_URL = 'https://youtube.com/@italosilva';

// ==============================
// CONTROLE DA LIVE
// ==============================

let liveConhecida = null;
let liveAnunciadaAoVivo = false;

// ==============================
// BUSCAR LIVE AO VIVO
// ==============================

async function verificarYouTube() {

    if (!YOUTUBE_API) {
        console.log('❌ YOUTUBE_API não configurada no Render.');
        return;
    }

    try {

        // ==============================
        // PROCURAR SOMENTE LIVE AO VIVO
        // ==============================

        const liveUrl =
            `https://www.googleapis.com/youtube/v3/search` +
            `?part=snippet` +
            `&channelId=${YOUTUBE_CHANNEL_ID}` +
            `&eventType=live` +
            `&type=video` +
            `&maxResults=1` +
            `&key=${YOUTUBE_API}`;

        const liveResponse = await fetch(liveUrl);
        const liveData = await liveResponse.json();

        // ==============================
        // ERRO DA API
        // ==============================

        if (liveData.error) {

            console.error(
                '❌ Erro ao procurar live ativa:'
            );

            console.error(liveData.error);

            return;
        }

        const liveVideos = liveData.items || [];

        // ==============================
        // NENHUMA LIVE
        // ==============================

        if (liveVideos.length === 0) {

            console.log(
                '⚪ Nenhuma live ativa no momento.'
            );

            // Permite detectar uma nova live futuramente
            liveConhecida = null;
            liveAnunciadaAoVivo = false;

            return;
        }

        // ==============================
        // LIVE ENCONTRADA
        // ==============================

        const video = liveVideos[0];

        const videoId = video.id.videoId;

        const titulo = video.snippet.title;

        const thumbnail =
            video.snippet.thumbnails.maxres?.url ||
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url;

        const link =
            `https://www.youtube.com/watch?v=${videoId}`;

        console.log(
            `🔴 Live encontrada: ${titulo}`
        );

        // ==============================
        // NOVA LIVE
        // ==============================

        if (
            liveConhecida !== videoId ||
            !liveAnunciadaAoVivo
        ) {

            console.log(
                '📢 Nova live detectada. Enviando aviso...'
            );

            const enviado = await enviarLiveAoVivo({
                titulo,
                thumbnail,
                link
            });

            // Só marca como anunciada
            // se o Discord realmente recebeu a mensagem
            if (enviado) {

                liveConhecida = videoId;
                liveAnunciadaAoVivo = true;

                console.log(
                    '✅ Live marcada como anunciada.'
                );

            } else {

                console.log(
                    '⚠️ Aviso não foi enviado. Tentará novamente.'
                );
            }
        }

    } catch (error) {

        console.error(
            '❌ Erro ao consultar o YouTube:'
        );

        console.error(error);
    }
}

// ==============================
// AVISO DE LIVE AO VIVO
// ==============================

async function enviarLiveAoVivo({
    titulo,
    thumbnail,
    link
}) {

    try {

        const canal = await client.channels.fetch(
            CANAL_NOTIFICACAO_ID
        );

        if (!canal) {

            console.log(
                '❌ Canal de notificação não encontrado.'
            );

            return false;
        }

        const embed = new EmbedBuilder()

            .setTitle('🔴 LIVE ON FAMÍLIA')

            .setDescription(
                '**Italo Silva está ao vivo!** 🎥\n\n' +
                'A transmissão começou. Acesse agora e acompanhe a live em tempo real.'
            )

            .addFields({
                name: '🎬 Transmissão',
                value: titulo
            })

            .setImage(thumbnail)

            .setColor(0xFF0000)

            .setFooter({
                text: 'LIVE ON • Italo Silva'
            })

            .setTimestamp();

        const botao = new ButtonBuilder()

            .setLabel('ASSISTIR AGORA')

            .setStyle(ButtonStyle.Link)

            .setURL(link)

            .setEmoji('▶️');

        const row = new ActionRowBuilder()
            .addComponents(botao);

        await canal.send({
            content: '@everyone',
            embeds: [embed],
            components: [row]
        });

        console.log(
            '🔴 Aviso de LIVE ON enviado.'
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Erro ao enviar aviso de LIVE ON:'
        );

        console.error(error);

        return false;
    }
}

// ==============================
// BOT ONLINE
// ==============================

client.once('clientReady', async () => {

    console.log(
        `🤖 Bot conectado como ${client.user.tag}`
    );

    // ==============================
    // STATUS DO BOT
    // ==============================

    client.user.setPresence({

        activities: [{
            name: '🔴 LIVE ON - ITALO SILVA',
            type: 1,
            url: YOUTUBE_URL
        }],

        status: 'online'
    });

    console.log(
        '📺 Status de transmissão ativado.'
    );

    // ==============================
    // ENTRAR AUTOMATICAMENTE NA CALL
    // ==============================

    try {

        const guild = await client.guilds.fetch(
            SERVIDOR_ID
        );

        console.log(
            `Servidor encontrado: ${guild.name}`
        );

        const channel = await guild.channels.fetch(
            CANAL_VOZ_ID
        );

        if (!channel) {

            console.error(
                'Canal de voz não encontrado.'
            );

        } else if (!channel.isVoiceBased()) {

            console.error(
                'O ID informado não pertence a um canal de voz.'
            );

        } else {

            console.log(
                `Canal encontrado: ${channel.name}`
            );

            joinVoiceChannel({

                channelId: channel.id,

                guildId: guild.id,

                adapterCreator: guild.voiceAdapterCreator,

                selfMute: false,

                selfDeaf: false
            });

            console.log(
                '🔊 Bot entrou na call.'
            );
        }

    } catch (error) {

        console.error(
            '❌ ERRO AO ENTRAR NA CALL:'
        );

        console.error(error);
    }

    // ==============================
    // INICIAR MONITORAMENTO DO YOUTUBE
    // ==============================

    console.log(
        '📺 Sistema de notificações do YouTube iniciado.'
    );

    verificarYouTube();

    // Verifica a cada 60 segundos
    setInterval(
        verificarYouTube,
        60 * 1000
    );
});

// ==============================
// LOGIN
// ==============================

client.login(TOKEN);
