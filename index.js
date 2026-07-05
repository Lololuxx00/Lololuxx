require("dotenv").config();
const fs = require("fs");

const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// =====================
// CLIENT
// =====================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =====================
// CONFIG
// =====================
const NO_COOLDOWN_ROLES = ["1523272559510945812"];
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const cooldown = new Map();

// =====================
// STOCK SYSTEM
// =====================
function getStock(service) {
    const path = `./stocks/${service}.txt`;

    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, "");
    }

    const stock = fs.readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean);

    return { stock, path };
}

// =====================
// READY
// =====================
client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} connecté`);
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async interaction => {

    // =====================
    // COMMANDES
    // =====================
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

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("steam").setLabel("Steam").setEmoji("🎮").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("crunchyroll").setLabel("Crunchyroll").setEmoji("📺").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("adn").setLabel("ADN").setEmoji("🎬").setStyle(ButtonStyle.Secondary)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("duolingo").setLabel("Duolingo").setEmoji("🐸").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("otacos").setLabel("O'Tacos").setEmoji("🌮").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("deezer").setLabel("Deezer").setEmoji("🎶").setStyle(ButtonStyle.Danger)
            );

            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("disney").setLabel("Disney+").setEmoji("🏰").setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row1, row2, row3]
            });
        }

        // /stock
        if (interaction.commandName === "stock") {

            const services = [
                "steam",
                "crunchyroll",
                "adn",
                "duolingo",
                "otacos",
                "deezer",
                "disney"
            ];

            let desc = "";

            for (let s of services) {
                const file = `./stocks/${s}.txt`;

                const count = fs.existsSync(file)
                    ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean).length
                    : 0;

                desc += `**${s}** : ${count}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("📊 Stock global")
                .setDescription(desc);

            return interaction.reply({ embeds: [embed] });
        }

        // /addstock
        if (interaction.commandName === "addstock") {

            if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
                return interaction.reply({
                    content: "🚫 Tu n'as pas la permission.",
                    ephemeral: true
                });
            }

            const service = interaction.options.getString("service").toLowerCase();
            const stockValue = interaction.options.getString("stock");

            const path = `./stocks/${service}.txt`;

            fs.appendFileSync(path, stockValue + "\n");

            return interaction.reply({
                content: `✅ Stock ajouté pour **${service}**`,
                ephemeral: true
            });
        }
    }

    // =====================
    // BUTTONS
    // =====================
    if (interaction.isButton()) {

        const services = [
            "steam",
            "crunchyroll",
            "adn",
            "duolingo",
            "otacos",
            "deezer",
            "disney"
        ];

        if (!services.includes(interaction.customId)) return;

        // =====================
        // COOLDOWN 7 MIN
        // =====================
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownTime = 7 * 60 * 1000;

        const member = interaction.member;

        const bypass = NO_COOLDOWN_ROLES.some(role =>
            member.roles.cache.has(role)
        );

        if (!bypass) {

            if (cooldown.has(userId)) {
                const expire = cooldown.get(userId);

                if (now < expire) {
                    const remaining = Math.ceil((expire - now) / 1000);

                    return interaction.reply({
                        content: `⏳ Attends encore ${remaining}s`,
                        ephemeral: true
                    });
                }
            }

            cooldown.set(userId, now + cooldownTime);
        }

        // =====================
        // STOCK
        // =====================
        const { stock, path } = getStock(interaction.customId);

        if (stock.length === 0) {
            return interaction.reply({
                content: "❌ Plus de stock.",
                ephemeral: true
            });
        }

        const account = stock.shift();
        fs.writeFileSync(path, stock.join("\n"));

        // =====================
        // DM
        // =====================
        await interaction.user.send(
            `🎁 **${interaction.customId.toUpperCase()}**\n\`${account}\``
        ).catch(() => null);

        // =====================
        // LOGS
        // =====================
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

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
                        .setTimestamp()
                ]
            });
        }

        return interaction.reply({
            content: "📩 Envoyé en MP !",
            ephemeral: true
        });
    }
});

// =====================
// LOGIN
// =====================
client.login(process.env.TOKEN);