const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("list")
		.setDescription("Shows you all crews that currently exist!"),
    async execute(interaction) {
        const { crewDB } = require("../index.js")
        function getCrews() {
            let string = ""
            if (Object.keys(crewDB).length >= 1) {
                for (let crew in crewDB) {
                    string = string + "**[" + crewDB[crew].tag + "] " + crewDB[crew].name + "**\nOwner: <@!" + crewDB[crew].owner + ">" + "\nMembers: " 
                    for (let member in crewDB[crew].members) {
                        string = string + "<@!" + crewDB[crew].members[member] + "> "
                    }
                    string = string + "\nTokens: " + crewDB[crew].tokens.toString() + "\n\n"
                }
            } else {
                string = "There are no currently existing crews!"
            }
            return string
        }

        const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("All Crews and members")
        .setDescription(getCrews())
        
        interaction.reply({embeds:[embed],ephemeral: true})
    }
}