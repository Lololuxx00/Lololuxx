<<<<<<< HEAD
require("dotenv").config();
const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Suppression des commandes globales...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log("✅ Commandes globales supprimées !");
    } catch (err) {
        console.error(err);
    }
=======
require("dotenv").config();
const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Suppression des commandes globales...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log("✅ Commandes globales supprimées !");
    } catch (err) {
        console.error(err);
    }
>>>>>>> f0e516e748b4c60f8c9c7a4aea40baefe997c30a
})();