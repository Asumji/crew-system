const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("token")
		.setDescription("Lets you manipulate a crew's tokens! Needs Manage Server permissions!")
        .addSubcommand(sub => 
            sub.setName("add")
            .setDescription("Adds a certain amount of a crew's tokens!")
            .addStringOption(option => option.setName("crew").setDescription("The crew you want to manipulate!").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Amount of tokens to add to the crew's balance!").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("remove")
            .setDescription("Removes a certain amount of a crew's tokens!")
            .addStringOption(option => option.setName("crew").setDescription("The crew you want to manipulate!").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Amount of tokens to remove from the crew's balance!").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("set")
            .setDescription("Sets a crew's tokens!")
            .addStringOption(option => option.setName("crew").setDescription("The crew you want to manipulate!").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Amount of tokens to set the crew's balance to!").setRequired(true))
        ),
    async execute(interaction) {
        const { crewDB } = require("../index.js")
        if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
            if (crewDB.hasOwnProperty(interaction.options.getString("crew"))) {
                if (interaction.options._subcommand == "add") {
                    crewDB[interaction.options.getString("crew")].tokens += interaction.options.getInteger("amount")
                    interaction.reply({content:"Added " + interaction.options.getInteger("amount").toString() + " tokens to " + interaction.options.getString("crew") + "'s balance!",ephemeral:true})
                } else if (interaction.options._subcommand == "remove") {
                    crewDB[interaction.options.getString("crew")].tokens -= interaction.options.getInteger("amount")
                    interaction.reply({content:"Removed " + interaction.options.getInteger("amount").toString() + " tokens from " + interaction.options.getString("crew") + "'s balance!",ephemeral:true})
                } else if (interaction.options._subcommand == "set") {
                    crewDB[interaction.options.getString("crew")].tokens = interaction.options.getInteger("amount")
                    interaction.reply({content:"Set " + interaction.options.getString("crew") + "'s tokens to " + interaction.options.getInteger("amount").toString() + "!",ephemeral:true})
                }
                fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
					console.log(err);
				});
            } else {
                interaction.reply({content:"That crew does not exist!", ephemeral:true})
            }
        } else {
            interaction.reply({content:"You do not have the permissions to execute this command!", ephemeral:true})
        }
    }
}