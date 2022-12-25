const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("trade")
		.setDescription("Trade items and tokens with other crews!")
		.addStringOption(option => option.setName("crew").setDescription("The crew to trade with").setRequired(true))
		.addStringOption(option => option.setName("type").setDescription("The thing you want to trade").setRequired(true).addChoices({name:"Token", value:"token"},{name:"Item",value:"item"}))
		.addStringOption(option => option.setName("value").setDescription("Amount of tokens or name of item you want to trade").setRequired(true)),
    async execute(interaction) {
		const { crewDB } = require("../index.js")

        function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}

		if (getCrew(interaction.user.id) != undefined) {
			if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
				if (crewDB.hasOwnProperty(interaction.options.getString("crew"))) {
					if (interaction.options.getString("crew") != crewDB[getCrew(interaction.user.id)].name) {
						if (interaction.options.getString("type") == "token") {
							if (!isNaN(interaction.options.getString("value"))) {
								if (crewDB[getCrew(interaction.user.id)].tokens >= Number(interaction.options.getString("value"))) {
									crewDB[interaction.options.getString("crew")].tokens += Number(interaction.options.getString("value"))
									crewDB[getCrew(interaction.user.id)].tokens -= Number(interaction.options.getString("value"))
									fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
										console.log(err);
									});
									interaction.reply({content:"Traded " + interaction.options.getString("value") + " tokens to " + interaction.options.getString("crew") + "!", ephemeral:true})
								} else {
									interaction.reply({content:"You do not have sufficient funds!", ephemeral:true})
								}
							} else {
								interaction.reply({content:"The amount provided was not a Number!", ephemeral:true})
							}
						} else if (interaction.options.getString("type") == "item") {
							if (crewDB[getCrew(interaction.user.id)].items.includes(interaction.options.getString("value"))) {
								if (!crewDB[interaction.options.getString("crew")].items.includes(interaction.options.getString("value"))) {
									crewDB[getCrew(interaction.user.id)].items.splice(crewDB[getCrew(interaction.user.id)].items.indexOf(interaction.options.getString("value")), 1)
									crewDB[interaction.options.getString("crew")].items.push(interaction.options.getString("value"))
									fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
										console.log(err);
									});
									interaction.reply({content:"Traded " + interaction.options.getString("value") + " to " + interaction.options.getString("crew") + "!", ephemeral:true})
								} else {
									interaction.reply({content:"The provided crew already owns this item!", ephemeral:true})
								}
							} else {
								interaction.reply({content:"You do not own that item!", ephemeral:true})
							}
						} else {
							interaction.reply({content:"The provided type seems to be invalid!", ephemeral:true})
						}
					} else {
						interaction.reply({content:"Cannot trade with your own crew!", ephemeral:true})
					}
				} else {
					interaction.reply({content:"That crew does not exist!", ephemeral:true})
				}
			} else {
				interaction.reply({content:"Only the owner of a crew can trade!",ephemeral:true})
			}
		} else {
			interaction.reply({content:"You can only use these commands if you are in a crew!",ephemeral:true})
		}
    }
}
