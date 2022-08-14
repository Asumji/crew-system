const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Everything crewshop!")
        .addSubcommand(sub => 
            sub.setName("show")
            .setDescription("Shows all buyable items in the shop!") 
        )
        .addSubcommand(sub => 
            sub.setName("inventory")
            .setDescription("Shows your crew's inventory (Items and tokens)!") 
        )
        .addSubcommand(sub => 
            sub.setName("buy")
            .setDescription("Lets you buy items from the shop!")
            .addStringOption(option => option.setName("item").setDescription("The item you want to buy").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("sell")
            .setDescription("Lets you sell items to the shop!")
            .addStringOption(option => option.setName("item").setDescription("The item you want to sell").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("additem")
            .setDescription("Lets you add items to the shop (Requires Manage Server Permission)!")
            .addStringOption(option => option.setName("name").setDescription("The name of the item you want to add").setRequired(true))
            .addStringOption(option => option.setName("description").setDescription("The description of the item you want to add").setRequired(true))
            .addIntegerOption(option => option.setName("price").setDescription("The price of the item you want to add").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("removeitem")
            .setDescription("Lets you remove items from the shop (Requires Manage Server Permission)!")
            .addStringOption(option => option.setName("item").setDescription("The item you want to remove").setRequired(true))
        ),
    async execute(interaction) {
        const { shopDB, crewDB } = require("../index.js")

        function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}

        function getItems() {
            let string = ""
            if (Object.keys(shopDB).length > crewDB[getCrew(interaction.user.id)].items.length) {
                for (let item in shopDB) {
                    if (!crewDB[getCrew(interaction.user.id)].items.includes(item)) {
                        string = string + "**" + item + "**\n" + shopDB[item].description + "\nPrice: " + shopDB[item].price + " Tokens\n\n"
                    }
                }
            } else {
                string = "There are no items in the shop!"
            }
            return string
        }

        function getInventory() {
            let string = ""
            string = "**Balance:** " + crewDB[getCrew(interaction.user.id)].tokens + " Tokens\n\n**Items:**\n"
            for (let item in crewDB[getCrew(interaction.user.id)].items) {
                string = string + crewDB[getCrew(interaction.user.id)].items[item] + " **|** Value: " + shopDB[crewDB[getCrew(interaction.user.id)].items[item]].price + " Tokens\n"
            }
            return string
        }
        if (getCrew(interaction.user.id) != undefined) {
            if (interaction.options._subcommand == "show") {
                const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Shop")
                .setDescription(getItems())

                interaction.reply({embeds:[embed],ephemeral: true})
            } else if (interaction.options._subcommand == "inventory") {
                const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Inventory")
                .setDescription(getInventory())

                interaction.reply({embeds:[embed],ephemeral: true})
            } else if (interaction.options._subcommand == "buy") {
                if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
                    if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                        if (crewDB[getCrew(interaction.user.id)].tokens >= shopDB[interaction.options.getString("item")].price) {
                            crewDB[getCrew(interaction.user.id)].items.push(interaction.options.getString("item"))
                            crewDB[getCrew(interaction.user.id)].tokens -= shopDB[interaction.options.getString("item")].price

                            fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                                console.log(err);
                            });
                            interaction.reply({content:"You bought " + interaction.options.getString("item") + " for " + shopDB[interaction.options.getString("item")].price + " tokens!",ephemeral:true})
                        } else {
                            interaction.reply({content:"Your crew doesn't have enough tokens!",ephemeral:true})
                        }
                    } else {
                        interaction.reply({content:"You provided an invalid item!",ephemeral:true})
                    }
                } else {
                    interaction.reply({content:"Only the owner of a crew can buy items!",ephemeral:true})
                }
            } else if (interaction.options._subcommand == "sell") {
                if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
                    if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                        crewDB[getCrew(interaction.user.id)].items.splice(crewDB[getCrew(interaction.user.id)].items.indexOf(interaction.options.getString("item")), 1)
                        crewDB[getCrew(interaction.user.id)].tokens += shopDB[interaction.options.getString("item")].price

                        fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                            console.log(err);
                        });
                        interaction.reply({content:"You sold " + interaction.options.getString("item") + " for " + shopDB[interaction.options.getString("item")].price + " tokens!",ephemeral:true})
                    } else {
                        interaction.reply({content:"You provided an invalid item!",ephemeral:true})
                    }
                } else {
                    interaction.reply({content:"Only the owner of a crew can sell items!",ephemeral:true})
                }
            }
        } else {
            interaction.reply({content:"You can only use these commands if you are in a crew!",ephemeral:true})
        }
        if (interaction.options._subcommand == "additem") {
            if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
                if (!shopDB.hasOwnProperty(interaction.options.getString("name"))) {
                    shopDB[interaction.options.getString("name")] = {
                        name: interaction.options.getString("name"),
                        description: interaction.options.getString("description"),
                        price: interaction.options.getInteger("price")
                    }
                    fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                        console.log(err);
                    });
                    interaction.reply({content:"You added " + interaction.options.getString("name") + " as an item into the shop!",ephemeral:true})
                } else {
                    interaction.reply({content:"That item already exists",ephemeral:true})
                }
            } else {
                interaction.reply({content:"You do not have the permissions to use this command!",ephemeral:true})
            }
        } else if (interaction.options._subcommand == "removeitem") {
            if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
                if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                    delete shopDB[interaction.options.getString("item")]

                    for (let crew in crewDB) {
                        if (crewDB[crew].items.includes(interaction.options.getString("item"))) {
                            crewDB[crew].items.splice(crewDB[crew].items.indexOf(interaction.options.getString("item")), 1)
                        }
                    }

                    fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                        console.log(err);
                    });
                    fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                        console.log(err);
                    });
                    interaction.reply({content:"You removed " + interaction.options.getString("name") + " from the shop!",ephemeral:true})
                } else {
                    interaction.reply({content:"That item does not exists",ephemeral:true})
                }
            } else {
                interaction.reply({content:"You do not have the permissions to use this command!",ephemeral:true})
            }
        }
    }
}
