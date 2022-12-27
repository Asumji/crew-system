const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("crew")
		.setDescription("Lets you manage all things crew!")
		.addSubcommand(sub => 
			sub.setName("create")
			.setDescription("Lets you create a crew!")
			.addStringOption(option => option.setName("name").setDescription("The name of the crew!").setRequired(true))
			.addStringOption(option => option.setName("tag").setDescription("The tag of the crew! max. 3 letters").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("invite")
			.setDescription("Invite people to your group!")
			.addUserOption(option => option.setName("user").setDescription("The user you want to invite.").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("leave")
			.setDescription("Leave your current crew!")
			.addUserOption(option => option.setName("user").setDescription("If you are the owner and want to leave add a user here otherwise ingore this option."))
		)
		.addSubcommand(sub => 
			sub.setName("transfer")
			.setDescription("Transfer ownership to someone else!")
			.addUserOption(option => option.setName("user").setDescription("The user to transfer ownership to!").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("delete")
			.setDescription("Deletes your crew! (Use this if you want to leave but there's no one left in your crew!)")
		)
		.addSubcommand(sub => 
			sub.setName("kick")
			.setDescription("Kick a user from your crew!")
			.addUserOption(option => option.setName("user").setDescription("The user to kick!").setRequired(true))	
		),
	async execute(interaction) {
		function checkCrew(entry) {
			let returnee = true
			for (let i=0;i<entry.length;i++) {
				let value = entry[i]
				for (let crew in crewDB) {
					if (crew != undefined) {
						if (crewDB[crew].name == value) {
							returnee = "This name is taken!"
						} else if (crewDB[crew].tag == value) {
							returnee = "This tag is taken!"
						} else if (crewDB[crew].members.includes(value)) {
							returnee = "You are already a member of a crew!"
						} else if (crewDB[crew].owner == value) {
							returnee = "You already own a crew!"
						}
					}
				}
			}
			return returnee
		}

		function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}
		
		async function resetMembers(memberArray) {
			for (let member in memberArray) {
				const memberObj = await interaction.guild.members.fetch(memberArray[member])
				if (memberObj.manageable) {
					memberObj.setNickname(memberObj.user.username)
				}
			}
		}

		const { crewDB } = require("../index.js")
		if (crewDB[getCrew(interaction.user.id)]) {
			if (interaction.options._subcommand == "invite") {
				const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
					.setCustomId("acceptInvite")
					.setLabel("Accept")
					.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
					.setCustomId("declineInvite")
					.setLabel("Decline")
					.setStyle(ButtonStyle.Danger),
				);
				if (interaction.options.getUser("user") != interaction.user) {
					if (interaction.options.getUser("user").id != interaction.applicationId)
					if (checkCrew([interaction.options.getUser("user").id]) == true) {
						if (interaction.options.getUser("user").id != interaction.applicationId) {
							if (checkCrew([interaction.user.id]) == "You already own a crew!") {
								interaction.options.getUser("user").send({content: interaction.user.username + " has invited you to join their crew!", components: [row]}).then(ch=> {
									interaction.reply({content: "You invited <@!" + interaction.options.getUser("user") + "> to your crew!", ephemeral:true})
									const collector = ch.createMessageComponentCollector({ time: 15000 });
									collector.on("collect", async i => {
										if (i.customId == "acceptInvite") {
											crewDB[getCrew(interaction.user.id)].members.push(interaction.options.getUser("user").id)
											let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
											interaction.guild.channels.cache.get(crewChId).permissionOverwrites.edit(interaction.options.getUser("user"),
												{
													ViewChannel:true
												}
											)
											if (interaction.guild.ownerId != interaction.options.getUser("user").id) {
												if (interaction.guild.members.cache.get(interaction.options.getUser("user").id).displayName.length <= 26) {
													await i.update({ content: 'You accepted the invite!', components: [] });
													interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname("[" + crewDB[getCrew(interaction.user.id)].tag + "] " + interaction.guild.members.cache.get(interaction.options.getUser("user").id).displayName)
												} else {
													await i.update({ content: 'You accepted the invite!\nYour Name was too long for me to attach the Crew Tag to!', components: [] });
													interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname("[" + crewDB[getCrew(interaction.user.id)].tag + "] " + "TooLong")
												}
											} else {
												await i.update({ content: 'You accepted the invite!\nNickname was not changed due to insufficient Permissions!', components: [] });
											}

											fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
												console.log(err);
											});
										} else {
											await i.update({ content: 'You declined the invite!', components: [] });
										}
									});
								}).catch(() => interaction.reply({content:"The user you invited does not accept DMs, tell them to enable DMs!",ephemeral:true}))
							} else {
								interaction.reply({content:"You don't own the crew you're in!",ephemeral:true})
							}
						} else {
							interaction.reply({content:"I cannot be invited to a crew!",ephemeral:true})
						}
					} else {
						interaction.reply({content: "<@!" + interaction.options.getUser("user") + "> is already in a crew! They can run /crew leave to leave it!", ephemeral:true})
					}
				} else {
					interaction.reply({content: "You can't invite yourself!", ephemeral:true})
				}
			} else if (interaction.options._subcommand == "leave") {
				if (checkCrew([interaction.user.id]) != true) {
					if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
						if (interaction.options.getUser("user") != undefined) {
							if (getCrew(interaction.options.getUser("user").id) == getCrew(interaction.user.id)) {
								let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
								interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.user)
								crewDB[getCrew(interaction.user.id)].owner = interaction.options.getUser("user").id
								crewDB[getCrew(interaction.options.getUser("user").id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)

								fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
									console.log(err);
								});
								if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
									interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
									interaction.reply({content:"You left the crew and transferred your ownership!",ephemeral:true})
								} else {
									interaction.reply({content:"You left the crew and transferred your ownership!\nYour Nickname could not be changed due to me having insufficient Permissions!",ephemeral:true})
								}
							} else {
								interaction.reply({content:"The member your provided isn't in your crew!",ephemeral:true})
							}
						} else {
							interaction.reply({content:"You didn't provide a member to transfer ownership to!", ephemeral:true})
						}
					} else {
						let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
						interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.user)
						crewDB[getCrew(interaction.user.id)].members.splice(crewDB[getCrew(interaction.user.id)].members.indexOf(interaction.user.id), 1)

						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
						if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
							interaction.reply({content:"You left the crew!",ephemeral:true})
							interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
						} else {
							interaction.reply({content:"You left the crew!\nYour Nickname could not be changed due to me having insufficient Permissions!",ephemeral:true})
						}
					}
				} else {
					interaction.reply({content:"You are not in a crew!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "transfer") {
				let user = interaction.options.getUser("user")
				if (interaction.user.id != user.id) {
					if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
						if (getCrew(user.id) == getCrew(interaction.user.id)) {
							crewDB[getCrew(interaction.user.id)].owner = interaction.options.getUser("user").id
							crewDB[getCrew(user.id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)
							crewDB[getCrew(user.id)].members.push(interaction.user.id)

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
							interaction.reply({content:"You transferred ownership to <@!" + interaction.options.getUser("user").id + ">!", ephemeral:true})
						} else {
							interaction.reply({content:"That user is not in your crew!",ephemeral:true})
						}
					} else {
						interaction.reply({content:"You are not the owner of your crew!",ephemeral:true})
					}
				} else {
					interaction.reply({content:"You can't transfer ownership to yourself!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "delete") {
				if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
					if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
						interaction.reply({content:"Your crew has been deleted!",ephemeral:true})
						resetMembers(crewDB[getCrew(interaction.user.id)].members)
						interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
					} else {
						resetMembers(crewDB[getCrew(interaction.user.id)].members)
						interaction.reply({content:"Your crew has been deleted!\nYour Nickname could not be changed due to me having insufficient Permissions!",ephemeral:true})
					}
					let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
					interaction.guild.channels.cache.get(crewChId).delete()
					interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).delete()

					delete crewDB[getCrew(interaction.user.id)]
					
					fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
						console.log(err);
					});
				} else {
					interaction.reply({content:"You are not the owner of your crew!!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "kick") {
				let user = interaction.options.getUser("user")
				if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
					if (getCrew(user.id) == getCrew(interaction.user.id)) {
						let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
						interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.options.getUser("user"))
						crewDB[getCrew(interaction.options.getUser("user").id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)

						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
						if (interaction.guild.ownerId != interaction.options.getUser("user").id) {
							interaction.reply({content:"You kicked <@!" + interaction.options.getUser("user").id + "> out of your crew!",ephemeral:true})
							interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname(interaction.options.getUser("user").username)
						} else {
							interaction.reply({content:"You kicked <@!" + interaction.options.getUser("user").id + "> out of your crew!\nTheir Nickname could not be changed due to me having insufficient Permissions!",ephemeral:true})
						}
					} else {
						interaction.reply({content:"That user is not in your crew!",ephemeral:true})
					}
				} else {
					interaction.reply({content:"You are not the owner of your crew!!",ephemeral:true})
				}
			}
		} else {
			if (interaction.options._subcommand != "create") {
				interaction.reply({content:"You can only use these commands if you are in a crew!",ephemeral:true})
			}
		}
		if (interaction.options._subcommand == "create") {
			if (interaction.options.getString("tag").length <= 3) {
				if (checkCrew([interaction.options.getString("name"), interaction.options.getString("tag"), interaction.user.id]) == true ) {
					crewDB[interaction.options.getString("name")] = {
						name: interaction.options.getString("name"),
						tag: interaction.options.getString("tag").toUpperCase(),
						members: [],
						owner: interaction.user.id,
						categoryID: "",
						tokens: 0,
						items: []
					}
					await interaction.guild.channels.create({name:getCrew(interaction.user.id),type:ChannelType.GuildCategory}).then(ch => {
						crewDB[getCrew(interaction.user.id)].categoryID = ch.id
						interaction.guild.channels.create({name:"crew-chat",type:ChannelType.GuildText,parent:ch.id}).then(chh => {
							chh.permissionOverwrites.set([
								{
									id: interaction.guild.roles.everyone,
									deny: [PermissionFlagsBits.ViewChannel]
								},
								{
									id: interaction.user.id,
									allow: [PermissionFlagsBits.ViewChannel]
								}
							])
						})
					})
					fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
						console.log(err);
					});
					if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
						if (interaction.guild.members.cache.get(interaction.user.id).displayName.length <= 26) {
							interaction.reply({ content: "Successfully created a new crew with the name [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name, ephemeral: true })
							interaction.guild.members.cache.get(interaction.user.id).setNickname("[" + crewDB[interaction.options.getString("name")].tag + "] " + interaction.guild.members.cache.get(interaction.user.id).displayName)
						} else {
							interaction.reply({ content: "Successfully created a new crew with the name [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name + "\nYour Username was sadly too long so I set it to a placeholder!", ephemeral: true })
							interaction.guild.members.cache.get(interaction.user.id).setNickname("[" + crewDB[interaction.options.getString("name")].tag + "] " + "TooLong")
						}
					} else {
						interaction.reply({ content: "Successfully created a new crew with the name [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name + "\nYour Nickname could not be changed due to me having insufficient Permissions!", ephemeral: true })
					}
				} else {
					interaction.reply({content: checkCrew([interaction.options.getString("name"), interaction.options.getString("tag"), interaction.user.id]), ephemeral: true})
				}
			} else {
				interaction.reply({ content: "The tag has too many letters!", ephemeral: true })
			}
		}
	},
};
