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
// CONTROLE DO MONITORAMENTO
// ==============================

let monitoramentoAtivo = false;
let liveEncontradaHoje = false;
let ultimoDiaMonitorado = null;

// ==============================
// HORÁRIO DO MONITORAMENTO
// ==============================

const HORA_INICIO = 15;
const MINUTO_INICIO = 55;

const HORA_FIM = 23;
const MINUTO_FIM = 0;

// ==============================
// PEGAR DATA/HORA DO BRASIL
// ==============================

function obterHorarioBrasil() {

    const agora = new Date();

    const partes = new Intl.DateTimeFormat(
        'en-US',
        {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }
    ).formatToParts(agora);

    const pegar = (tipo) => {

        return Number(
            partes.find(
                parte => parte.type === tipo
            ).value
        );
    };

    return {
        ano: pegar('year'),
        mes: pegar('month'),
        dia: pegar('day'),
        hora: pegar('hour'),
        minuto: pegar('minute')
    };
}

// ==============================
// VERIFICAR SE ESTÁ NO HORÁRIO
// ==============================

function estaNoHorarioDoMonitoramento() {

    const agora = obterHorarioBrasil();

    const minutosAtuais =
        agora.hora * 60 +
        agora.minuto;

    const inicio =
        HORA_INICIO * 60 +
        MINUTO_INICIO;

    const fim =
        HORA_FIM * 60 +
        MINUTO_FIM;

    return (
        minutosAtuais >= inicio &&
        minutosAtuais < fim
    );
}

// ==============================
// IDENTIFICAR O DIA ATUAL
// ==============================

function obterDiaAtual() {

    const agora = obterHorarioBrasil();

    return `${agora.ano}-${agora.mes}-${agora.dia}`;
}

// ==============================
// RESETAR PARA UM NOVO DIA
// ==============================

function verificarNovoDia() {

    const diaAtual = obterDiaAtual();

    if (ultimoDiaMonitorado !== diaAtual) {

        ultimoDiaMonitorado = diaAtual;

        monitoramentoAtivo = false;

        liveEncontradaHoje = false;

        console.log(
            `📅 Novo dia detectado: ${diaAtual}`
        );
    }
}

// ==============================
// BUSCAR LIVE AO VIVO
// ==============================

async function verificarYouTube() {

    verificarNovoDia();

    // ==============================
    // ANTES DAS 15:55
    // ==============================

    if (!estaNoHorarioDoMonitoramento()) {

        return;
    }

    // ==============================
    // SE JÁ ENCONTROU A LIVE
    // ==============================

    if (liveEncontradaHoje) {

        return;
    }

    // ==============================
    // ATIVAR MONITORAMENTO
    // ==============================

    if (!monitoramentoAtivo) {

        monitoramentoAtivo = true;

        console.log(
            '📺 Monitoramento do YouTube ativado.'
        );

        console.log(
            '🔎 Procurando live a cada 5 minutos.'
        );
    }

    if (!YOUTUBE_API) {

        console.log(
            '❌ YOUTUBE_API não configurada no Render.'
        );

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

        const liveResponse =
            await fetch(liveUrl);

        const liveData =
            await liveResponse.json();

        // ==============================
        // ERRO DA API
        // ==============================

        if (liveData.error) {

            console.error(
                '❌ Erro ao procurar live ativa:'
            );

            console.error(
                liveData.error
            );

            return;
        }

        const liveVideos =
            liveData.items || [];

        // ==============================
        // NENHUMA LIVE
        // ==============================

        if (liveVideos.length === 0) {

            console.log(
                '⚪ Nenhuma live ativa no momento.'
            );

            return;
        }

        // ==============================
        // LIVE ENCONTRADA
        // ==============================

        const video =
            liveVideos[0];

        const videoId =
            video.id.videoId;

        const titulo =
            video.snippet.title;

        const thumbnail =
            video.snippet.thumbnails.maxres?.url ||
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url;

        const link =
            `https://www.youtube.com/watch?v=${videoId}`;

        console.log(
            `🔴 LIVE ENCONTRADA: ${titulo}`
        );

        console.log(
            '📢 Enviando aviso para o Discord...'
        );

        // ==============================
        // ENVIAR AVISO
        // ==============================

        const enviado =
            await enviarLiveAoVivo({
                titulo,
                thumbnail,
                link
            });

        // ==============================
        // SE ENVIOU COM SUCESSO
        // ==============================

        if (enviado) {

            liveEncontradaHoje = true;

            monitoramentoAtivo = false;

            console.log(
                '✅ Aviso enviado com sucesso.'
            );

            console.log(
                '🛑 Monitoramento do YouTube encerrado por hoje.'
            );

            console.log(
                '📅 Amanhã, às 15:55, o monitoramento será iniciado novamente.'
            );

        } else {

            console.log(
                '⚠️ Aviso não foi enviado.'
            );

            console.log(
                '🔄 Tentará novamente na próxima verificação.'
            );
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

        const canal =
            await client.channels.fetch(
                CANAL_NOTIFICACAO_ID
            );

        if (!canal) {

            console.log(
                '❌ Canal de notificação não encontrado.'
            );

            return false;
        }

        const embed =
            new EmbedBuilder()

                .setTitle(
                    '🔴 LIVE ON FAMÍLIA'
                )

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

        const botao =
            new ButtonBuilder()

                .setLabel(
                    'ASSISTIR AGORA'
                )

                .setStyle(
                    ButtonStyle.Link
                )

                .setURL(link)

                .setEmoji('▶️');

        const row =
            new ActionRowBuilder()
                .addComponents(botao);

        await canal.send({

            content: '@everyone',

            embeds: [
                embed
            ],

            components: [
                row
            ]
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

client.once(
    'clientReady',
    async () => {

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

            const guild =
                await client.guilds.fetch(
                    SERVIDOR_ID
                );

            console.log(
                `Servidor encontrado: ${guild.name}`
            );

            const channel =
                await guild.channels.fetch(
                    CANAL_VOZ_ID
                );

            if (!channel) {

                console.error(
                    'Canal de voz não encontrado.'
                );

            } else if (
                !channel.isVoiceBased()
            ) {

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

                    adapterCreator:
                        guild.voiceAdapterCreator,

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
        // INICIAR MONITORAMENTO
        // ==============================

        console.log(
            '📺 Sistema de notificações do YouTube iniciado.'
        );

        console.log(
            '⏰ O monitoramento começará às 15:55.'
        );

        // Primeira verificação
        // Não faz consulta antes do horário.
        verificarYouTube();

        // ==============================
        // VERIFICA A CADA 5 MINUTOS
        // ==============================

        setInterval(
            verificarYouTube,
            5 * 60 * 1000
        );
    }
);

// ==============================
// LOGIN
// ==============================

client.login(TOKEN);
