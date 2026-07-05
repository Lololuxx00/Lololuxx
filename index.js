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

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 👑 rôles bypass cooldown
const NO_COOLDOWN_ROLES = ["1523272559510945812"];
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const cooldown = new Map();

// 🔧 stock function
function getStock(service) {
    let path = `./stocks/${service}.txt`;

    let stock = fs.readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean);

    return { stock, path };
}

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} connecté`);
});

client.on(Events.InteractionCreate, async interaction => {

    // =====================
    // COMMANDES
    // =====================
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "ping") {
            return interaction.reply("🏓 Pong !");
        }

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
                new ButtonBuilder().setCustomId("tunnelbear").setLabel("TunnelBear").setEmoji("🐻").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("disney").setLabel("Disney+").setEmoji("🏰").setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row, row2, row3]
            });
        }

        if (interaction.commandName === "stock") {

            const services = [
                "steam",
                "crunchyroll",
                "adn",
                "duolingo",
                "otacos",
                "tunnelbear",
                "disney"
            ];

            let desc = "";

            for (let s of services) {
                let file = `./stocks/${s}.txt`;

                let count = fs.existsSync(file)
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
            "tunnelbear",
            "disney"
        ];

        if (!services.includes(interaction.customId)) return;

        let { stock, path } = getStock(interaction.customId);

        if (stock.length === 0) {
            return interaction.reply({ content: "❌ Plus de stock.", ephemeral: true });
        }

        let account = stock.shift();
        fs.writeFileSync(path, stock.join("\n"));

        await interaction.user.send(`🎁 **${interaction.customId.toUpperCase()}**\n\`${account}\``);

        return interaction.reply({
            content: "📩 Envoyé en MP !",
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);