require("dotenv").config();

const { MongoClient } = require("mongodb");
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
// MONGO DB
// =====================
const clientMongo = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
    await clientMongo.connect();
    db = clientMongo.db("discordbot");
    console.log("🟢 MongoDB connecté");
}
connectDB();

// =====================
// DISCORD BOT
// =====================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const NO_COOLDOWN_ROLES = ["1523272559510945812"];
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const cooldown = new Map();

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} connecté`);
});

// =====================
// PANEL
// =====================
client.on(Events.InteractionCreate, async interaction => {

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
            new ButtonBuilder().setCustomId("steam").setLabel("Steam").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("crunchyroll").setLabel("Crunchyroll").setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    }

    // =====================
    // ADDSTOCK (MONGO)
    // =====================
    if (interaction.commandName === "addstock") {

        const member = interaction.member;

        if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({ content: "🚫 No permission", ephemeral: true });
        }

        const service = interaction.options.getString("service").toLowerCase();
        const stockValue = interaction.options.getString("stock");

        await db.collection("stocks").insertOne({
            service,
            account: stockValue
        });

        return interaction.reply({
            content: `✅ Stock ajouté pour **${service}**`,
            ephemeral: true
        });
    }

    // =====================
    // STOCK VIEW
    // =====================
    if (interaction.commandName === "stock") {

        const services = ["steam", "crunchyroll"];

        let desc = "";

        for (let s of services) {
            const count = await db.collection("stocks").countDocuments({ service: s });
            desc += `**${s}** : ${count}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("📊 Stock global")
            .setDescription(desc);

        return interaction.reply({ embeds: [embed] });
    }
}

// =====================
// BUTTONS (GEN STOCK)
// =====================
if (interaction.isButton()) {

    const service = interaction.customId;

    const account = await db.collection("stocks").findOne({ service });

    if (!account) {
        return interaction.reply({ content: "❌ Plus de stock.", ephemeral: true });
    }

    await db.collection("stocks").deleteOne({ _id: account._id });

    await interaction.user.send(`🎁 **${service.toUpperCase()}**\n\`${account.account}\``);

    return interaction.reply({
        content: "📩 Envoyé en MP !",
        ephemeral: true
    });
}

});

client.login(process.env.TOKEN);