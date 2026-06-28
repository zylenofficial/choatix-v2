const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const lib = url.protocol === 'https:' ? https : require('http');
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Create bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('redeem')
      .setDescription('Redeem a Choatix license key')
      .addStringOption(option =>
        option.setName('key').setDescription('Your license key (CHTX-XXXX-XXXX-XXXX)').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check your Choatix license status'),
  ];

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commands registered!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'redeem') {
    const key = interaction.options.getString('key').trim().toUpperCase();
    const discordId = interaction.user.id;

    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/redeem', { key, discordId });

      if (result.success) {
        await interaction.editReply({
          content: `✅ **License Activated!**\n\nPlan: **${result.tier}**\n\nYou can now use all ${result.tier} features in Choatix V2!`,
        });
      } else {
        await interaction.editReply({
          content: `❌ **Activation Failed**\n\n${result.message}`,
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server. Make sure it\'s running.',
      });
    }
  }

  if (interaction.commandName === 'status') {
    const discordId = interaction.user.id;

    await interaction.deferReply();

    try {
      const result = await apiRequest('GET', `/api/license/${discordId}`);

      if (result.tier) {
        await interaction.editReply({
          content: `📋 **Your License**\n\nPlan: **${result.tier}**\nActivated: ${result.activatedAt}`,
        });
      } else {
        await interaction.editReply({
          content: '📋 **No License Found**\n\nYou haven\'t redeemed a key yet.\n\nUse `/redeem` with your license key to activate.',
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server.',
      });
    }
  }
});

// Start bot
registerCommands();
client.login(BOT_TOKEN).then(() => {
  console.log('Choatix Bot is online!');
}).catch((err) => {
  console.error('Failed to start bot:', err.message);
  console.log('\nTo use the Discord bot:');
  console.log('1. Create a bot at https://discord.com/developers/applications');
  console.log('2. Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in environment');
  console.log('3. Run: node bot.js');
});
