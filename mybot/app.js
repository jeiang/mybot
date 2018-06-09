// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config contains the bot's token and the owner ID(mine)

const values = require("./values.json");
// values contains swear words, instructions for help
// prefix activity, and the auto response object

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(` ${values.myActivity}`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(` ${values.myActivity}`);
});

client.on("guildDelete", guild => {
    // This event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(` ${values.myActivity}`);
});

client.on("guildMemberAdd", (member) => {
    // This event triggers every time a new member joins a guild
    console.log(`New User ${member.user.username} has joined ${member.guild.name}"`);
    try {
        member.guild.channels.find("name", "general").send(`${member.user.username} has joined this server, Yay!!!`);
    }
    catch (error) {
        console.log(`Error: ${error}.`);
    }
});


client.on("message", async message => {
    // This will run on all messages without the prefix

    // This is for automatic server management and automatic reaction to messages.
    // No human intervention  occurs here

    if (message.author.bot) return;
    // Deny bots from triggering

    var discordmsg = message.content.toLowerCase();
    // This converts the content of the message to fully lowercase for the purpose of
    // comparing messages to encoded values

    //Responds to automatic responses
    if (values.responseObject[message.content]) {
        message.channel.send(values.responseObject[message.content]);
    }
});

client.on("message", async message => {
    // This Event is for the swear filter
    //This function is to replace the words for the swear filter
    function replaceSwearWords(msg, oldWord, newWord) {
        // Taking the message to replace, the word to be replaced and what to replace it with
        var args = msg.trim().split(/ +/g);
        // Breaking the message up into parts, removing excess spaces
        args.forEach(function (word, index) {
            // Processing each word and taking its index and the value
            if (word === oldWord) {
                // Checking to see if the value at this index is equal to the value
                args[index] = newWord;
                // If true, replaces the value
            }
        });
        return args.join(" ");
        // Reconstructs the sentence using spaces 
    }

    var discordmsg = message.content.toLowerCase();

    if (message.author.bot) return;

    // This checks the swearWords array in the config file and compares messages to them 
    // If swearWords have been detected it will replace the swear words with *censored* and repost the message

    if (!values.swearFilter) return;
    // Kills process if swear filter is turned off
    const swearWords = values.swearWords;
    // Sets a new variable called swearWords instead of continuously using the full variable
    if (swearWords.some(word => discordmsg.includes(word))) {
        // Checks to see if the message includes any swear words
        var exp = [];
        var word = "";
        // Creates two variables for usage in the two loops for removal of the words
        for (i = 0; i < swearWords.length; i++) {
            if (discordmsg.includes(swearWords[i])) {
                exp.splice(i, 0, swearWords[i]);
                // Identifies all of the swear words used in the message
            }
        }
        for (i = 0; i < exp.length; i++) {
            word = exp[i];
            // Assigns a word per iteration to be replaced
            msg = replaceSwearWords(discordmsg, word, "[Only niglets like me swear]");
            // Sends the entire message, the word and the replacement to the function
            // and assigns it to the new message
        }
        console.log(`Censored a message from ${message.author}`);
        // Logs event
        message.reply(` said "${msg}".`);
        // Sends censored version to the channel
        message.delete().catch(error => { console.log(`Error: ${error}`); });
        // Removes initial statement with swear words
    }
});

client.on("message", async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Also good practice to ignore any message that does not start with our prefix, 
    // which is set in the configuration file.
    if (message.content.indexOf(values.prefix) !== 0) return;

    // Here we separate our "command" name, and our "arguments" for the command. 
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(values.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    
    // Let's go with a few common example commands! Feel free to delete or change those.

    if (command === "play") {
        // Sets a new activity for the bot

        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)) || !args)
            return message.reply("Sorry, you don't have permissions to use this!");
        // Denies access to people without the role of Admin or Mod

        const newActivity = args.join(" ");
        // Compiles args into a full statement
        message.delete().catch(error => { console.log(`Error: ${error}.`); });
        // Deletes command
        values.myActivity = newActivity;
        // Sets the new activity in values
        client.user.setActivity(` ${values.myActivity}`).catch(error => { console.log(`Error: ${error}.`); });
        // Sets new activity 
        message.channel.send(`I am now playing ${values.myActivity}`);
        console.log("Activity has been changed to " + values.myActivity + ".");
        // Notifies users and logs the event
    }

    if (command === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }

    if (command === "say") {
        // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
        // To get the "message" itself we join the `args` back into a string with spaces: 
        const sayMessage = args.join(" ");
        // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
        message.delete().catch(O_o => { });
        // And we get the bot to say the thing: 
        message.channel.send(sayMessage)
            .catch(reply => {
                message.reply("say <text> - Makes the bot send a message.");
            });
    }

    if (command === "kick") {
        // This command must be limited to mods and admins. In this example we just hardcode the role names.
        // Please read on Array.some() to understand this bit: 
        // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)))
            return message.reply("Sorry, you don't have permissions to use this!");

        // Let's first check if we have a member and if we can kick them!
        // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
        // We can also support getting the member by ID, which would be args[0]
        let member = message.mentions.members.first() || message.guild.members.get(args[0]);
        if (!member)
            return message.reply("Please mention a valid member of this server");
        if (!member.kickable)
            return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

        // slice(1) removes the first part, which here should be the user mention or ID
        // join(' ') takes all the various parts to make it a single string.
        let reason = args.slice(1).join(' ');
        if (!reason) reason = "No reason provided";

        // Now, time for a swift kick in the nuts!
        await member.kick(reason)
            .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
        message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

    }

    if (command === "ban") {
        // Most of this command is identical to kick, except that here we'll only let admins do it.
        // In the real world mods could ban too, but this is just an example, right? ;)
        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)))
            return message.reply("Sorry, you don't have permissions to use this!");

        let member = message.mentions.members.first();
        if (!member)
            return message.reply("Please mention a valid member of this server");
        if (!member.bannable)
            return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

        let reason = args.slice(1).join(' ');
        if (!reason) reason = "No reason provided";

        await member.ban(reason)
            .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
        message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
    }

    if (command === "purge") {
        // This command removes all messages from all users in the channel, up to 100.

        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)))
            return message.reply("Sorry, you don't have permissions to use this!");

        // get the delete count, as an actual number.
        const deleteCount = parseInt(args[0], 10);

        // Ooooh nice, combined conditions. <3
        if (!deleteCount || deleteCount < 2 || deleteCount > 100)
            return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

        // So we get our messages, and delete them. Simple enough, right?
        const fetched = await message.channel.fetchMessages({ limit: deleteCount });
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));

        // Logs the change.
        console.log(`${deleteCount} messages were deleted.`);
    }
    
    if (command === "prefix") {
        // This command rewrites the prefix to whatever the admin wants.

        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)))
            return message.reply("Sorry, you don't have permissions to use this!");

        if (!args) return message.reply("Please enter a valid prefix.");

        // Assigns the new prefix to memory
        values.prefix = args[0];

        // Deletes message
        message.delete();

        // Informs user of successful change and logs the changes.
        message.channel.send(`The prefix has been changed to ${values.prefix}`);
        console.log(`Prefix now set to ${values.prefix}.`);
    }

    if (command === "filter") {
        // Allows mods to temporarily disable the swear filter

        if (!message.member.roles.some(r => values.controlRoles.includes(r.name)))
            return message.reply("Sorry, you don't have permissions to use this!");

        var onOff = args.join("");
        // Gets the desired activition state of the filter
        if (onOff === "on") {
            // Checks to see if the filter is on
            if (values.swearFilter === true) return message.channel.send("The swear filter is already active.");
            // Informs the user that the filter is already on if it is
            values.swearFilter = true;
            message.channel.send("The swear filter is now active.");
            // Informs the user of the successful activation of the filter
        } else if (onOff === "off") {
            if (values.swearFilter === false) return message.channel.send("The swear filter is already deactivated.");
            // Inform the user that the filter is already off if it is
            values.swearFilter = false;
            message.channel.send("The swear filter is now deactivated.");
            // Informs the user of the successful activation of the filter
        } else {
            message.channel.send("Please enter on or off");
            // Asks the user to input valid answer
        }


    }

    if (command === "help") {
        // Command to output all useable commands

        var helplist = "";
        // Output message storage variable

        values.instructions.forEach(function (instruction) {
            // Compiling all instructions
            helplist += `${instruction} \n`;
        });
        // Adding on swear filter activity
        if (values.swearFilter) {
            helplist += "Swear filter is active";
        } else {
            helplist += "Swear filter is inactive";
        }
        // Outputting message
        message.channel.send(helplist);
    } 
});

client.login(config.token);