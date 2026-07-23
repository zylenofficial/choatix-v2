const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PRO_ROLE_ID = process.env.PRO_ROLE_ID || '1517719772702314616';
const PREMIUM_ROLE_ID = process.env.PREMIUM_ROLE_ID || '1517719827580452994';
const ADMIN_SECRET = 'choatix-admin-2024';
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

const ADMIN_IDS = ['1014494449809772544', '1520176133461512324', '1322475983386837006'];

const activeGiveaways = new Map();

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateKeyLocal(tier) {
  const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
  const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  const SECRET = 'choatix-secret-key-2024';
  const hash = hashCode(`${tier}:${expiry}:${nonce}:${SECRET}`);
  const checksum = hash.toString(36).toUpperCase().padStart(4, '0').substring(0, 4);
  return `CHTX-${tier.substring(0, 4)}-${nonce}-${checksum}`;
}

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
  rest: { timeout: 30000 },
  presence: { activities: [{ name: 'Choatix V2', type: 3 }], status: 'online' },
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
    new SlashCommandBuilder()
      .setName('refer')
      .setDescription('Get your referral code or redeem one'),
    new SlashCommandBuilder()
      .setName('redeem-referral')
      .setDescription('Redeem a referral code for free PRO')
      .addStringOption(option =>
        option.setName('code').setDescription('Referral code (CHOA-XXXXXX)').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('giveaway')
      .setDescription('Start a giveaway for a license key (admin only)')
      .addStringOption(option =>
        option.setName('tier').setDescription('Key tier').addChoices(
          { name: 'Pro', value: 'PRO' },
          { name: 'Premium', value: 'PREMIUM' },
        ).setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('duration').setDescription('Duration in minutes').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('message').setDescription('Giveaway message')
      ),
    new SlashCommandBuilder()
      .setName('generate-key')
      .setDescription('Generate license keys (admin only)')
      .addStringOption(option =>
        option.setName('tier').setDescription('Key tier').addChoices(
          { name: 'Pro', value: 'PRO' },
          { name: 'Premium', value: 'PREMIUM' },
        ).setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('count').setDescription('Number of keys to generate (1-10)').setMinValue(1).setMaxValue(10).setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('List all available commands'),
    new SlashCommandBuilder()
      .setName('invite')
      .setDescription('Get the Discord server invite link'),
    new SlashCommandBuilder()
      .setName('download')
      .setDescription('Get the Choatix V2 download link'),
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency'),
    new SlashCommandBuilder()
      .setName('profile')
      .setDescription('View your Choatix profile'),
    new SlashCommandBuilder()
      .setName('changelog')
      .setDescription('View latest Choatix V2 updates'),
    new SlashCommandBuilder()
      .setName('revoke')
      .setDescription('Revoke a license key (admin only)')
      .addStringOption(option =>
        option.setName('key').setDescription('License key to revoke').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('announce')
      .setDescription('Send an announcement embed (admin only)')
      .addStringOption(option =>
        option.setName('title').setDescription('Embed title').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('message').setDescription('Embed message').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('color').setDescription('Hex color (e.g. ff0000)').setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View bot and server statistics (admin only)'),
    new SlashCommandBuilder()
      .setName('broadcast')
      .setDescription('DM all licensed users (admin only)')
      .addStringOption(option =>
        option.setName('message').setDescription('Message to send').setRequired(true)
      ),
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

  const otherRoleId = tier === 'PREMIUM' ? PRO_ROLE_ID : PREMIUM_ROLE_ID;
  if (member.roles.cache.has(otherRoleId)) {
    await member.roles.remove(otherRoleId).catch(() => {});
  }

  if (!member.roles.cache.has(roleId)) {
    await member.roles.add(role);
  }
  return true;
}

async function removeRole(member) {
  if (member.roles.cache.has(PRO_ROLE_ID)) await member.roles.remove(PRO_ROLE_ID).catch(() => {});
  if (member.roles.cache.has(PREMIUM_ROLE_ID)) await member.roles.remove(PREMIUM_ROLE_ID).catch(() => {});
}

client.on('interactionCreate', async (interaction) => {
  // ─── /redeem ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'redeem') {
    const key = interaction.options.getString('key').trim().toUpperCase();
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/redeem', { key, discordId });

      if (result.success) {
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

  // ─── /status ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'status') {
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

  // ─── /unlink ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'unlink') {
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/license/unlink', { discordId });
      if (result.success) {
        await removeRole(interaction.member);
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

  // ─── /refer ───────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'refer') {
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      let result = await apiRequest('GET', `/api/referral/user/${discordId}`);
      if (!result.code) {
        result = await apiRequest('POST', '/api/referral/create', { discordId });
      }

      if (result.success || result.code) {
        const uses = result.uses || 0;
        const maxUses = result.maxUses || 10;
        const bar = '█'.repeat(Math.floor(uses / maxUses * 10)) + '░'.repeat(10 - Math.floor(uses / maxUses * 10));

        await interaction.editReply({
          content: `🔗 **Your Referral Code**\n\n\`${result.code}\`\n\nShare this code. When someone uses it:\n→ They get **PRO** for free\n→ You get **PREMIUM** upgrade\n\nUses: ${uses}/${maxUses}\n\`${bar}\``,
        });
      } else {
        await interaction.editReply({
          content: '❌ **Failed** to create referral code.',
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server.',
      });
    }
  }

  // ─── /redeem-referral ─────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'redeem-referral') {
    const code = interaction.options.getString('code').trim().toUpperCase();
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('POST', '/api/referral/redeem', { code, refereeId: discordId });

      if (result.success) {
        const roleAssigned = await assignRole(interaction.member, result.refereeReward);
        const roleMsg = roleAssigned ? '\nRole assigned on this server!' : '';

        await interaction.editReply({
          content: `✅ **Referral Redeemed!**\n\nYou got: **${result.refereeReward}**${roleMsg}\nThe referrer got: **${result.referrerReward}**\n\nEnjoy Choatix V2!`,
        });
      } else {
        await interaction.editReply({
          content: `❌ **Failed**\n\n${result.message}`,
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** Could not connect to license server.',
      });
    }
  }

  // ─── /giveaway (admin only) ───────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway') {
    const tier = interaction.options.getString('tier');
    const duration = interaction.options.getInteger('duration');
    const message = interaction.options.getString('message') || `Win a **${tier}** license key!`;

    // Only admin can create giveaways
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    await interaction.deferReply();

    const endTime = Date.now() + duration * 60 * 1000;
    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway')
      .setDescription(message)
      .addFields(
        { name: 'Prize', value: `${tier} License Key`, inline: true },
        { name: 'Ends', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
      )
      .setColor(tier === 'PREMIUM' ? 0xffffff : 0xcccccc)
      .setFooter({ text: 'Click the button to enter!' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${Date.now()}`)
        .setLabel('Enter')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎫'),
    );

    const msg = await interaction.editReply({ embeds: [embed], components: [row] });

    activeGiveaways.set(msg.id, {
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      tier,
      endTime,
      entries: new Set(),
      messageId: msg.id,
    });

    setTimeout(async () => {
      const giveaway = activeGiveaways.get(msg.id);
      if (!giveaway) return;
      activeGiveaways.delete(msg.id);

      const entries = [...giveaway.entries];
      if (entries.length === 0) {
        const noWin = EmbedBuilder.from(embed).setDescription('No entries. Giveaway cancelled.');
        await interaction.channel.messages.edit(msg.id, { embeds: [noWin], components: [] }).catch(() => {});
        return;
      }

      const winnerId = entries[Math.floor(Math.random() * entries.length)];

      const genResult = await apiRequest('POST', '/api/generate', { tier, count: 1, adminSecret: ADMIN_SECRET });
      const wonKey = genResult.success && genResult.keys ? genResult.keys[0] : null;

      const winDesc = wonKey
        ? `**Winner: <@${winnerId}>**\n\nYour key: \`${wonKey}\`\n\nRun \`/redeem key:${wonKey}\` to activate!`
        : `**Winner: <@${winnerId}>**\n\nA ${tier} key was generated. Run \`/redeem\` to check your status.`;

      const winEmbed = EmbedBuilder.from(embed)
        .setDescription(winDesc)
        .setColor(0xffffff);

      await interaction.channel.messages.edit(msg.id, { embeds: [winEmbed], components: [] }).catch(() => {});

      try {
        const winner = interaction.guild.members.cache.get(winnerId);
        if (winner) {
          const dmText = wonKey
            ? `🎉 You won a **${tier}** Choatix license key!\n\nYour key: \`${wonKey}\`\n\nRun \`/redeem key:${wonKey}\` in the server to activate!`
            : `🎉 You won a **${tier}** Choatix license key!\n\nRun \`/redeem\` in the server to activate!`;
          await winner.send(dmText);
        }
      } catch {}
    }, duration * 60 * 1000);
  }

  // ─── Giveaway button clicks ───────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('giveaway_enter_')) {
    const giveawayId = interaction.customId.replace('giveaway_enter_', '');
    const msgId = interaction.message.id;
    const giveaway = activeGiveaways.get(msgId);

    if (!giveaway) {
      return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true });
    }

    if (giveaway.entries.has(interaction.user.id)) {
      giveaway.entries.delete(interaction.user.id);
      return interaction.reply({ content: '❌ You left the giveaway.', ephemeral: true });
    }

    giveaway.entries.add(interaction.user.id);
    return interaction.reply({ content: `✅ Entered! ${giveaway.entries.size} entries so far.`, ephemeral: true });
  }

  // ─── /generate-key (admin only) ──────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'generate-key') {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    const tier = interaction.options.getString('tier');
    const count = interaction.options.getInteger('count');
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await apiRequest('POST', '/api/generate', { tier, count, adminSecret: ADMIN_SECRET });

      if (result.success && result.keys) {
        const keyList = result.keys.join('\n');
        await interaction.editReply({
          content: '✅ **Keys Generated**\n\n' + '```' + keyList + '```' + '\n' + result.keys.length + ' key(s) saved to database and ready to share.',
        });
      } else {
        await interaction.editReply({
          content: '❌ **Failed** ' + (result.error || 'Unknown error — backend may be starting up'),
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: '❌ **Error** ' + error.message,
      });
    }
  }

  // ─── /help ────────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📖 Choatix V2 — Commands')
      .setDescription('All available bot commands')
      .addFields(
        { name: '🔑 License', value: '`/redeem` — Redeem a license key\n`/status` — Check your license\n`/unlink` — Unlink your license', inline: false },
        { name: '🔗 Referrals', value: '`/refer` — Get your referral code\n`/redeem-referral` — Redeem a referral code', inline: false },
        { name: '🎉 Fun', value: '`/giveaway` — Start a giveaway (admin)\n`/profile` — View your profile', inline: false },
        { name: 'ℹ️ Info', value: '`/help` — This message\n`/ping` — Bot latency\n`/invite` — Server invite\n`/download` — Download Choatix V2\n`/changelog` — Latest updates', inline: false },
        { name: '🛠️ Admin', value: '`/generate-key` — Generate keys\n`/revoke` — Revoke a key\n`/announce` — Send announcement\n`/stats` — Server statistics\n`/broadcast` — DM all users', inline: false },
      )
      .setColor(0xffffff)
      .setFooter({ text: 'Choatix V2 — Gaming Optimization' });

    await interaction.reply({ embeds: [embed] });
  }

  // ─── /invite ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'invite') {
    const embed = new EmbedBuilder()
      .setTitle('🔗 Join Our Server')
      .setDescription('[Click here to join Choatix Discord](https://discord.gg/AhEK85REhG)')
      .setColor(0xffffff);

    await interaction.reply({ embeds: [embed] });
  }

  // ─── /download ────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'download') {
    const embed = new EmbedBuilder()
      .setTitle('⬇️ Download Choatix V2')
      .setDescription('[Click here to download](https://github.com/zylenofficial/choatix-v2/releases/latest)\n\nChoose the latest `Setup.exe` from Assets.')
      .setColor(0xffffff);

    await interaction.reply({ embeds: [embed] });
  }

  // ─── /ping ────────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await interaction.editReply({
      content: `🏓 **Pong!**\n\nBot Latency: **${latency}ms**\nAPI Latency: **${apiLatency}ms**`,
    });
  }

  // ─── /profile ─────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'profile') {
    const discordId = interaction.user.id;
    await interaction.deferReply();

    try {
      const result = await apiRequest('GET', `/api/license/${discordId}`);
      const embed = new EmbedBuilder()
        .setTitle(`👤 ${interaction.user.username}'s Profile`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setColor(0xffffff);

      if (result.tier) {
        const key = result.key ? `\`${result.key}\`` : 'N/A';
        embed.addFields(
          { name: 'Plan', value: `**${result.tier}**`, inline: true },
          { name: 'Key', value: key, inline: true },
          { name: 'Activated', value: result.activatedAt ? `<t:${Math.floor(new Date(result.activatedAt).getTime() / 1000)}:R>` : 'N/A', inline: true },
        );
      } else {
        embed.setDescription('No license found.\n\nUse `/redeem` to activate a key.');
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: '❌ **Error** Could not connect to license server.' });
    }
  }

  // ─── /changelog ───────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'changelog') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Choatix V2 — Changelog')
      .setDescription('Latest updates and improvements')
      .addFields(
        { name: 'v2.3.0', value: '• 48 new tweaks (461 total)\n• Power Plan Manager\n• Game Settings Backup/Restore\n• Deep Clean one-click\n• Network Speed Test', inline: false },
        { name: 'v2.2.0', value: '• Custom dark installer\n• FPS Comparison\n• Settings redesign\n• Notification Bell\n• Leaderboard\n• Update checker', inline: false },
        { name: 'v2.1.0', value: '• CSS performance overhaul\n• ZeroDelay sensitivity dropdown\n• Game Optimizer inline tiers\n• Revert All button', inline: false },
        { name: 'v2.0.0', value: '• Full UI redesign\n• Discord bot + license server\n• 9-page layout\n• 400+ tweaks', inline: false },
      )
      .setColor(0xffffff)
      .setFooter({ text: 'github.com/zylenofficial/choatix-v2' });

    await interaction.reply({ embeds: [embed] });
  }

  // ─── /revoke (admin only) ────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'revoke') {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    const key = interaction.options.getString('key').trim().toUpperCase();
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await apiRequest('POST', '/api/admin/revoke', { key, adminSecret: ADMIN_SECRET });
      if (result.success) {
        await interaction.editReply({ content: `✅ **Key Revoked**\n\n\`${key}\` has been revoked and unlinked from any user.` });
      } else {
        await interaction.editReply({ content: `❌ **Failed**\n\n${result.message}` });
      }
    } catch (error) {
      await interaction.editReply({ content: '❌ **Error** Could not connect to license server.' });
    }
  }

  // ─── /announce (admin only) ──────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'announce') {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const colorHex = interaction.options.getString('color') || 'ffffff';
    const color = parseInt(colorHex.replace('#', ''), 16) || 0xffffff;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: `Announced by ${interaction.user.username}` });

    await interaction.reply({ content: '**📢 Announcement sent!**' });
    await interaction.channel.send({ embeds: [embed] });
  }

  // ─── /stats (admin only) ─────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'stats') {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await apiRequest('GET', '/api/admin/stats');
      const embed = new EmbedBuilder()
        .setTitle('📊 Choatix V2 — Statistics')
        .addFields(
          { name: 'Total Keys', value: String(result.totalKeys || 0), inline: true },
          { name: 'Redeemed', value: String(result.redeemedKeys || 0), inline: true },
          { name: 'PRO Users', value: String(result.proUsers || 0), inline: true },
          { name: 'PREMIUM Users', value: String(result.premiumUsers || 0), inline: true },
          { name: 'Referral Uses', value: String(result.totalReferrals || 0), inline: true },
          { name: 'Benchmarks', value: String(result.totalBenchmarks || 0), inline: true },
        )
        .setColor(0xffffff)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: '❌ **Error** Could not connect to license server.' });
    }
  }

  // ─── /broadcast (admin only) ─────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'broadcast') {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    const message = interaction.options.getString('message');
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await apiRequest('GET', '/api/admin/users');
      const users = result.users || [];
      if (users.length === 0) {
        return interaction.editReply({ content: '❌ No licensed users found.' });
      }

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const member = await interaction.guild.members.fetch(user.discord_id);
          if (member) {
            await member.send(`📢 **Choatix Announcement**\n\n${message}`);
            sent++;
          }
        } catch {
          failed++;
        }
      }

      await interaction.editReply({
        content: `✅ **Broadcast Sent**\n\nDelivered: **${sent}**\nFailed: **${failed}**\nTotal users: **${users.length}**`,
      });
    } catch (error) {
      await interaction.editReply({ content: '❌ **Error** Could not connect to license server.' });
    }
  }
});

client.on('error', (err) => {
  console.error('[BOT] Client error:', err.message);
});

client.on('shardDisconnect', () => {
  console.warn('[BOT] Disconnected. Reconnecting...');
});

client.on('shardReconnecting', () => {
  console.log('[BOT] Reconnecting...');
});

async function startBot(retryCount = 0) {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('[BOT] Skipped — no DISCORD_BOT_TOKEN set');
    return;
  }
  try {
    await registerCommands();
    await client.login(BOT_TOKEN);
    console.log('[BOT] Online! Logged in as', client.user?.tag);
  } catch (err) {
    console.error(`[BOT] Login failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err.message);
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => startBot(retryCount + 1), RETRY_DELAY * (retryCount + 1));
    } else {
      console.error('[BOT] Max retries reached. Will retry in 60s...');
      setTimeout(() => startBot(0), 60000);
    }
  }
}

process.on('unhandledRejection', (err) => {
  console.error('[BOT] Unhandled rejection:', err);
});

startBot();

module.exports = { startBot };
