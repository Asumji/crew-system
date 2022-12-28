const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("forcedelete")
		.setDescription("Deletes any crew (incase the owner left) Needs Manage Server permissions!")
        .addStringOption(option => option.setName("crew").setDescription("The crew you want to delete!").setRequired(true)),
    async execute(interaction) {
        const { crewDB } = require("../index.js")

        if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
            if (crewDB.hasOwnProperty(interaction.options.getString("crew"))) {
                for (let member in crewDB[interaction.options.getString("crew")].members) {
                    const memberObj = await interaction.guild.members.fetch(crewDB[interaction.options.getString("crew")].members[member])
                    if (memberObj.manageable) {
                        memberObj.setNickname(memberObj.user.username)
                    }
                }
                if (interaction.guild.channels.cache.find(ch => ch.id == crewDB[interaction.options.getString("crew")].categoryID)) {
                    if (interaction.guild.channels.cache.get(crewDB[interaction.options.getString("crew")].categoryID).children.cache.size > 0) {
                        let crewChId = interaction.guild.channels.cache.get(crewDB[interaction.options.getString("crew")].categoryID).children.cache.firstKey()
                        interaction.guild.channels.cache.get(crewChId).delete()
                        interaction.guild.channels.cache.get(crewDB[interaction.options.getString("crew")].categoryID).delete()
                    } else {
                        interaction.guild.channels.cache.get(crewDB[interaction.options.getString("crew")].categoryID).delete()
                    }
                }
                delete crewDB[interaction.options.getString("crew")]
					
                fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                    console.log(err);
                });
                interaction.reply({content:interaction.options.getString("crew") + " was deleted!", ephemeral:true})
            } else {
                interaction.reply({content:"That crew does not exist!", ephemeral:true})
            }
        }
    }
}
