const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Teste le bot"),

    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Affiche le panel de génération"),

    new SlashCommandBuilder()
        .setName("stock")
        .setDescription("Voir le stock disponible"),

    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Voir tes statistiques de génération"),

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