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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// =====================
// CONFIG
// =====================
const NO_COOLDOWN_ROLES = ["1523272559510945812"];
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const VIP_ROLE_ID = process.env.VIP_ROLE_ID;

const cooldown = new Map();
const processing = new Set(); // 🔥 anti double click
const userStats = new Map();

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
// COMMANDS
// =====================
if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "ping") {
        return interaction.reply("🏓 Pong !");
    }

    // =====================
    // PANEL
    // =====================
    if (interaction.commandName === "panel") {

        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({
                content: "🚫 Tu n'as pas la permission d'utiliser cette commande.",
                ephemeral: true
            });
        }

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
            new ButtonBuilder().setCustomId("disney").setLabel("Disney+").setEmoji("🏰").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("paramount").setLabel("Paramount+").setEmoji("🍿").setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
            embeds: [embed],
            components: [row1, row2, row3]
        });
    }

    // =====================
    // STOCK
    // =====================
    if (interaction.commandName === "stock") {

        const services = [
            "steam",
            "crunchyroll",
            "adn",
            "duolingo",
            "otacos",
            "deezer",
            "disney",
            "paramount"
        ];

        let desc = "";

        for (const s of services) {
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

    // =====================
    // ADDSTOCK
    // =====================
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

    // =====================
    // STATS
    // =====================
    if (interaction.commandName === "stats") {

        const stats = userStats.get(interaction.user.id);

        if (!stats) {
            return interaction.reply({
                content: "❌ Tu n'as encore effectué aucune génération.",
                ephemeral: true
            });
        }

        const favorite = Object.entries(stats.services)
            .sort((a, b) => b[1] - a[1])[0];

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`📊 Statistiques de ${interaction.user.username}`)
            .addFields(
                {
                    name: "📦 Générations totales",
                    value: `${stats.total}`,
                    inline: true
                },
                {
                    name: "🏆 Service le plus généré",
                    value: `${favorite[0]} (${favorite[1]} fois)`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
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
    "disney",
    "paramount"
];

    if (!services.includes(interaction.customId)) return;

    const userId = interaction.user.id;
    const now = Date.now();

    const member = interaction.guild.members.cache.get(userId);
    if (!member) return;

// =====================
// VÉRIFICATION DU STATUT
// =====================
const customStatus = member.presence?.activities.find(
    activity => activity.type === 4
);

if (!customStatus || !customStatus.state?.includes(".gg/te6WVUgyD9")) {
    return interaction.reply({
        content: "❌ Tu dois mettre `.gg/te6WVUgyD9` dans ton statut Discord avant de générer un compte.",
        ephemeral: true
    });
}

    const bypass = NO_COOLDOWN_ROLES.some(role =>
        member.roles.cache.has(role)
    );

    let cooldownTime = 7 * 60 * 1000;

    if (member.roles.cache.has(VIP_ROLE_ID)) {
        cooldownTime = 3 * 60 * 1000;
    }

    // =====================
    // ANTI DOUBLE CLIC
    // =====================
    if (processing.has(userId)) return;
    processing.add(userId);

    try {

        // =====================
        // COOLDOWN
        // =====================
        if (!bypass) {

            const expire = cooldown.get(userId);

            if (expire && now < expire) {

                const remaining = Math.ceil((expire - now) / 1000);

                return interaction.reply({
                    content: `⏳ Attends encore ${remaining}s`,
                    ephemeral: true
                });

            }

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
// STATS
// =====================
if (!userStats.has(userId)) {
    userStats.set(userId, {
        total: 0,
        services: {}
    });
}

const stats = userStats.get(userId);

stats.total++;

stats.services[interaction.customId] =
    (stats.services[interaction.customId] || 0) + 1;

        // =====================
        // DM
        // =====================
        try {

            await interaction.user.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Gold")
                        .setTitle("🎉 Génération réussie !")
                        .setDescription(`Voici ton compte **${interaction.customId.toUpperCase()}**`)
                        .addFields({
                            name: "📦 Compte",
                            value: `\`\`\`${account}\`\`\``
                        })
                        .setFooter({
                            text: "Merci d'utiliser notre bot !"
                        })
                        .setTimestamp()
                ]
            });

        } catch {

            // On remet le compte dans le stock
            stock.unshift(account);
            fs.writeFileSync(path, stock.join("\n"));

            return interaction.reply({
                content: "❌ Active tes messages privés.",
                ephemeral: true
            });

        }

        // =====================
        // COOLDOWN
        // =====================
        // On le met SEULEMENT si tout s'est bien passé
        if (!bypass) {
            cooldown.set(userId, now + cooldownTime);
        }

        // =====================
        // LOGS
        // =====================
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

        if (logChannel) {

            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle("📦 Génération")
                        .addFields(
                            {
                                name: "Utilisateur",
                                value: interaction.user.tag,
                                inline: true
                            },
                            {
                                name: "Service",
                                value: interaction.customId,
                                inline: true
                            },
                            {
                                name: "Compte",
                                value: `||${account}||`
                            }
                        )
                        .setTimestamp()
                ]
            });

        }

        return interaction.reply({
            content: "✅ Ton compte a été envoyé en message privé !",
            ephemeral: true
        });

    } finally {
        processing.delete(userId);
    }

} // <-- ferme le if (interaction.isButton())

}); // <-- ferme le client.on(...)


// =====================
// LOGIN
// =====================
client.login(process.env.TOKEN);