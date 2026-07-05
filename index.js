require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");

// 👑 rôles bypass cooldown
const NO_COOLDOWN_ROLES = [
    "1523272559510945812"
];

// 🛡️ rôle admin addstock (depuis .env)
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ⏳ cooldown 5 min
const cooldown = new Map();

// 📊 logs channel
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} connecté`);
});

// 🔧 stock function
function getStock(service) {
    let path = `./stocks/${service}.txt`;

    let stock = fs.readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean);

    return { stock, path };
}

client.on(Events.InteractionCreate, async interaction => {

    // =========================
    // SLASH COMMANDS
    // =========================
    if (interaction.isChatInputCommand()) {

        // /ping
        if (interaction.commandName === "ping") {
            return interaction.reply("🏓 Pong !");
        }

        // /panel
        if (interaction.commandName === "panel") {

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("⚡ Panel de génération")
                .setDescription("Choisissez un service.");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("steam").setLabel("Steam").setEmoji("🎮").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("crunchyroll").setLabel("Crunchyroll").setEmoji("📺").setStyle(ButtonStyle.Secondary)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("adn").setLabel("ADN").setEmoji("🎬").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("duolingo").setLabel("Duolingo").setEmoji("🐸").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("otacos").setLabel("O'Tacos").setEmoji("🌮").setStyle(ButtonStyle.Primary)
            );

            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("tunnelbear").setLabel("TunnelBear VPN").setEmoji("🐻").setStyle(ButtonStyle.Danger)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row, row2, row3]
            });
        }

        // 📊 /stock
        if (interaction.commandName === "stock") {

            const services = [
                "steam",
                "crunchyroll",
                "adn",
                "duolingo",
                "otacos",
                "tunnelbear"
            ];

            let desc = "";

            for (let s of services) {
                let count = fs.readFileSync(`./stocks/${s}.txt`, "utf8")
                    .split("\n")
                    .filter(Boolean).length;

                desc += `**${s}** : ${count}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("📊 Stock global")
                .setDescription(desc);

            return interaction.reply({ embeds: [embed] });
        }

        // 🛠️ /addstock (ROLE ONLY)
        if (interaction.commandName === "addstock") {

            const member = interaction.member;

            if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
                return interaction.reply({
                    content: "🚫 Tu n'as pas la permission.",
                    ephemeral: true
                });
            }

            const service = interaction.options.getString("service");
            const stockValue = interaction.options.getString("stock");

            const path = `./stocks/${service}.txt`;

            try {
                fs.appendFileSync(path, stockValue + "\n");

                return interaction.reply({
                    content: `✅ Stock ajouté pour **${service}**`,
                    ephemeral: true
                });

            } catch (err) {
                return interaction.reply({
                    content: "❌ Erreur lors de l'ajout du stock.",
                    ephemeral: true
                });
            }
        }
    }

    // =========================
    // BUTTONS
    // =========================
    if (interaction.isButton()) {

        const services = [
            "steam",
            "crunchyroll",
            "adn",
            "duolingo",
            "otacos",
            "tunnelbear"
        ];

        if (!services.includes(interaction.customId)) return;

        // ⏳ cooldown + bypass role
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000;

        const member = interaction.member;

        const bypass = NO_COOLDOWN_ROLES.some(r =>
            member.roles.cache.has(r)
        );

        if (!bypass) {

            if (cooldown.has(userId)) {
                const exp = cooldown.get(userId);

                if (now < exp) {
                    return interaction.reply({
                        content: `⏳ Attends encore ${(exp - now) / 1000}s`,
                        ephemeral: true
                    });
                }
            }

            cooldown.set(userId, now + cooldownTime);
        }

        // 📦 stock
        let { stock, path } = getStock(interaction.customId);

        if (stock.length === 0) {
            return interaction.reply({
                content: "❌ Plus de stock.",
                ephemeral: true
            });
        }

        let account = stock.shift();
        fs.writeFileSync(path, stock.join("\n"));

        try {

            await interaction.user.send(
                `🎁 **${interaction.customId.toUpperCase()}**\n\`${account}\``
            );

            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

            if (logChannel) {
                logChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle("📦 Génération")
                            .addFields(
                                { name: "User", value: interaction.user.tag, inline: true },
                                { name: "Service", value: interaction.customId, inline: true },
                                { name: "Compte", value: `||${account}||` }
                            )
                    ]
                });
            }

            return interaction.reply({
                content: "Je t'ai envoyer le compte en mp !",
                ephemeral: true
            });

        } catch {
            return interaction.reply({
                content: "Active tes MP !",
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);