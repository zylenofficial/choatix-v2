const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PRO_ROLE_ID = process.env.PRO_ROLE_ID || '1517719772702314616';
const PREMIUM_ROLE_ID = process.env.PREMIUM_ROLE_ID || '1517719827580452994';

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

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

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
    new SlashCommandBuilder()
      .setName('unlink')
      .setDescription('Unlink your Choatix license'),
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

async function assignRole(member, tier) {
  const roleId = tier === 'PREMIUM' ? PREMIUM_ROLE_ID : PRO_ROLE_ID;
  const role = member.guild.roles.cache.get(roleId);
  if (!role) {
    console.error(`Role not found for tier ${tier} (ID: ${roleId})`);
    return false;
  }

  // Remove other tier roles first
  const otherRoleId = tier === 'PREMIUM' ? PRO_ROLE_ID : PREMIUM_ROLE_ID;
  if (member.roles.cache.has(otherRoleId)) {
    await member.roles.remove(otherRoleId).catch(() => {});
  }

  if (!member.roles.cache.has(roleId)) {
    await member.roles.add(role);
  }
  return true;
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'redeem') {
    const key = interaction.options.getString('key').trim().toUpperCase();
    const discordId = interaction.user.id;

    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/redeem', { key, discordId });

      if (result.success) {
        // Assign Discord role
        const roleAssigned = await assignRole(interaction.member, result.tier);
        const roleMsg = roleAssigned ? '\nRole assigned on this server!' : '\n(Could not assign role — check bot permissions)';

        await interaction.editReply({
          content: `✅ **License Activated!**\n\nPlan: **${result.tier}**${roleMsg}\n\nYou can now use all ${result.tier} features in Choatix V2!`,
        });
      } else {
        await interaction.editReply({
          content: `❌ **Activation Failed**\n\n${result.message}`,
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server.',
      });
    }
  }

  if (interaction.commandName === 'status') {
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('GET', `/api/license/${discordId}`);
      if (result.tier) {
        const hasRole = interaction.member.roles.cache.has(result.tier === 'PREMIUM' ? PREMIUM_ROLE_ID : PRO_ROLE_ID);
        await interaction.editReply({
          content: `📋 **Your License**\n\nPlan: **${result.tier}**\nActivated: ${result.activatedAt}\nRole: ${hasRole ? '✅ Assigned' : '❌ Not assigned (run /redeem in this server)'}`,
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

  if (interaction.commandName === 'unlink') {
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/license/unlink', { discordId });
      if (result.success) {
        // Remove role
        const roleId = interaction.member.roles.cache.has(PREMIUM_ROLE_ID) ? PREMIUM_ROLE_ID : PRO_ROLE_ID;
        if (interaction.member.roles.cache.has(roleId)) {
          await interaction.member.roles.remove(roleId).catch(() => {});
        }
        await interaction.editReply({
          content: '✅ **License Unlinked**\n\nYour license has been removed. You can now give the key to someone else.',
        });
      } else {
        await interaction.editReply({
          content: `❌ **Failed**\n\n${result.message || 'No license found'}`,
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server.',
      });
    }
  }
});

registerCommands();
client.login(BOT_TOKEN).then(() => {
  console.log('Choatix Bot is online!');
}).catch((err) => {
  console.error('Failed to start bot:', err.message);
});
