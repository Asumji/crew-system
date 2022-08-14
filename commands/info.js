const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Explains this bots concept!"),
    async execute(interaction) {
        const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("Info")
        .addFields
            (
                {name:"Crews", value:"The base idea of the bot are crews: A crew consists of a tag, which is displayed in a member's nickname, a name, which is the full name the crew goes by, a private category for the members, and an owner who can manage said guild!"},
                {name:"Tokens",value:"Tokens are the currency crews use! These tokens can be given out by users with the Manage Server permission!"},
                {name:"Shop",value:"This is where you can spend your tokens. Users with the Manage Server permission can add and remove items from this shop!"},
                {name:"Additional Info",value:"As this is a project I, Asumji, worked on because I was bored I didn't implement automatic ways of gaining and spending tokens so these will be handled by the server staff! For example they could run events to give out tokens and add items like an extra channel!\nIf you want to see all crews use /list\nThis is a really bare-bones bot I made in a couple days so if you find any bugs, add me: Asumji#2143"}
            )
        .setFooter({text:"Crew System by Asumji#2143, made with lots of love and a couple days of boredom.",iconURL:"https://cdn.discordapp.com/avatars/612625159656046643/8ffe5e6eddb8dd9da1c0ef5bebcfff4e.webp?size=32"})
        interaction.reply({embeds:[embed],ephemeral:true})
    }
}