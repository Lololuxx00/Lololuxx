<<<<<<< HEAD
require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

    // 🏓 ping
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Teste le bot"),

    // 🎮 panel
    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Affiche le panel de génération"),

    // 📊 stock
    new SlashCommandBuilder()
        .setName("stock")
        .setDescription("Voir le stock disponible"),

    // 🛠️ addstock (admin)
    new SlashCommandBuilder()
        .setName("addstock")
        .setDescription("Ajouter du stock")
        .addStringOption(option =>
            option.setName("service")
                .setDescription("Nom du service")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("stock")
                .setDescription("Compte à ajouter")
                .setRequired(true)
        )

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Enregistrement des commandes...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("✅ Commandes enregistrées !");
    } catch (error) {
        console.error(error);
    }
=======
require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

    // 🏓 ping
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Teste le bot"),

    // 🎮 panel
    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Affiche le panel de génération"),

    // 📊 stock
    new SlashCommandBuilder()
        .setName("stock")
        .setDescription("Voir le stock disponible"),

    // 🛠️ addstock (admin)
    new SlashCommandBuilder()
        .setName("addstock")
        .setDescription("Ajouter du stock")
        .addStringOption(option =>
            option.setName("service")
                .setDescription("Nom du service")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("stock")
                .setDescription("Compte à ajouter")
                .setRequired(true)
        )

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Enregistrement des commandes...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("✅ Commandes enregistrées !");
    } catch (error) {
        console.error(error);
    }
>>>>>>> f0e516e748b4c60f8c9c7a4aea40baefe997c30a
})();