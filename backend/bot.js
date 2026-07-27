const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const API_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
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
      timeout: 8000,
    };

    const lib = url.protocol === 'https:' ? https : require('http');
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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
    new SlashCommandBuilder()
      .setName('daily')
      .setDescription('View and claim your daily quests'),
    new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Check your coin balance'),
    new SlashCommandBuilder()
      .setName('buy-pro')
      .setDescription('Spend coins for Pro access (100 coins = 1 hour)')
      .addIntegerOption(option =>
        option.setName('hours').setDescription('Hours of Pro (default 1)').setMinValue(1).setMaxValue(24).setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('coins-leaderboard')
      .setDescription('View the coins leaderboard'),
    new SlashCommandBuilder()
      .setName('rate')
      .setDescription('Rate a Choatix product (1-5 stars)')
      .addStringOption(option =>
        option.setName('product').setDescription('Product to rate').setRequired(true)
          .addChoices(
            { name: 'Basic Tweaks', value: 'basic' },
            { name: 'Pro Tweaks', value: 'pro' },
            { name: 'Extreme Tweaks', value: 'extreme' },
            { name: 'Precision Tweaks', value: 'precision' },
            { name: 'Premium Power Plan', value: 'power' },
            { name: 'Full Optimization', value: 'full' }
          )
      )
      .addIntegerOption(option =>
        option.setName('rating').setDescription('Rating 1-5').setRequired(true).setMinValue(1).setMaxValue(5)
      )
      .addStringOption(option =>
        option.setName('review').setDescription('Your review (optional)').setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('deliver')
      .setDescription('Deliver a product key after PayPal payment (admin)')
      .addStringOption(option =>
        option.setName('username').setDescription('Discord username of buyer').setRequired(true)
      )
      .addStringOption(option =>
        option.setName('product').setDescription('Product').setRequired(true)
          .addChoices(
            { name: 'Basic Tweaks', value: 'basic' },
            { name: 'Pro Tweaks', value: 'pro' },
            { name: 'Extreme Tweaks', value: 'extreme' },
            { name: 'Precision Tweaks', value: 'precision' },
            { name: 'Premium Power Plan', value: 'power' },
            { name: 'Full Optimization', value: 'full' }
          )
      ),
    new SlashCommandBuilder()
      .setName('claim')
      .setDescription('Get download links for your website purchases'),
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
        { name: '💰 Coins & Quests', value: '`/daily` — View daily quests\n`/balance` — Check coin balance\n`/buy-pro` — Spend coins for Pro access\n`/coins-leaderboard` — Top coin earners', inline: false },
        { name: '🛒 Purchase', value: '`/claim` — Claim your key after website purchase', inline: false },
        { name: '🎉 Fun', value: '`/giveaway` — Start a giveaway (admin)\n`/profile` — View your profile', inline: false },
        { name: 'ℹ️ Info', value: '`/help` — This message\n`/ping` — Bot latency\n`/invite` — Server invite\n`/download` — Download Choatix V2\n`/changelog` — Latest updates', inline: false },
        { name: '🛠️ Admin', value: '`/generate-key` — Generate keys\n`/deliver` — Deliver key after PayPal payment\n`/revoke` — Revoke a key\n`/announce` — Send announcement\n`/stats` — Server statistics\n`/broadcast` — DM all users', inline: false },
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
        const coinsResult = await apiRequest('GET', `/api/coins/${discordId}`);
        embed.addFields(
          { name: 'Plan', value: `**${result.tier}**`, inline: true },
          { name: 'Key', value: key, inline: true },
          { name: 'Activated', value: result.activatedAt ? `<t:${Math.floor(new Date(result.activatedAt).getTime() / 1000)}:R>` : 'N/A', inline: true },
          { name: 'Coins', value: `**${coinsResult.coins || 0}** (${coinsResult.total_earned || 0} earned)`, inline: true },
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
          { name: 'Total Coins Earned', value: String(result.totalCoinsEarned || 0), inline: true },
          { name: 'Pro Time Purchases', value: String(result.proTimePurchases || 0), inline: true },
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

  // ─── /daily ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'daily') {
    const discordId = interaction.user.id;

    try {
      await interaction.deferReply();

      const quests = await getQuestsToday(discordId);

      if (quests.length === 0) {
        return interaction.editReply({ content: '📋 No quests available today. Check back tomorrow!' });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Daily Quests')
        .setDescription('Complete quests to earn coins!\n100 coins = 1 hour Pro access')
        .setColor(0x2b2d31)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      let totalReward = 0;
      for (const q of quests) {
        const progress = Math.min(q.progress, q.target);
        const pct = Math.floor(progress / q.target * 100);
        const emoji = q.claimed ? '✅' : q.completed ? '🎁' : '⏳';
        const status = q.claimed ? 'Claimed ✨' : q.completed ? '🎁 Ready to claim!' : `${pct}% done`;

        embed.addFields({
          name: `${emoji} ${q.name} — ${q.reward} coins`,
          value: `${q.description}\n**${progress}** / **${q.target}** — ${status}`,
          inline: false,
        });
        totalReward += q.reward;
      }

      const claimable = quests.filter(q => q.completed && !q.claimed);
      const totalClaimed = quests.filter(q => q.claimed).length;
      const components = [];

      if (claimable.length > 0) {
        const row = new ActionRowBuilder();
        for (const q of claimable.slice(0, 5)) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`quest_claim_${q.id}`)
              .setLabel(`Claim ${q.name} (+${q.reward})`)
              .setStyle(ButtonStyle.Success)
              .setEmoji('🎁'),
          );
        }
        components.push(row);
      }

      embed.setFooter({ text: `${totalClaimed}/${quests.length} claimed today · Total: ${totalReward} coins possible` });

      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      console.error('[DAILY ERROR]', error.message);
      const msg = { content: '❌ Error loading daily quests. Make sure the server is running.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }

  // ─── Quest claim buttons ─────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('quest_claim_')) {
    const questId = parseInt(interaction.customId.replace('quest_claim_', ''));
    const discordId = interaction.user.id;

    try {
      const result = await claimQuest(discordId, questId);
      if (result.success) {
        await interaction.reply({ content: `✅ Claimed! You now have **${result.coins} coins**.`, ephemeral: true });
      } else {
        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
      }
    } catch {
      await interaction.reply({ content: '❌ Error claiming quest.', ephemeral: true });
    }
  }

  // ─── /balance ────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'balance') {
    const discordId = interaction.user.id;

    try {
      await interaction.deferReply();

      const result = await getCoins(discordId);
      const coins = result.coins || 0;
      const totalEarned = result.total_earned || 0;

      const proResult = await getProTime(discordId);
      const proActive = proResult.active;
      const proUntil = proResult.proUntil;

      const embed = new EmbedBuilder()
        .setTitle('💰 Your Balance')
        .addFields(
          { name: 'Coins', value: `**${coins}**`, inline: true },
          { name: 'Total Earned', value: `${totalEarned}`, inline: true },
          { name: 'Pro Status', value: proActive ? `✅ Active until <t:${Math.floor(new Date(proUntil).getTime() / 1000)}:R>` : '❌ Not active', inline: true },
        )
        .setColor(0x2b2d31)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: '100 coins = 1 hour Pro • Use /daily for quests' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[BALANCE ERROR]', error.message);
      const msg = { content: '❌ Error loading balance. Make sure the server is running.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }

  // ─── /buy-pro ────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'buy-pro') {
    const discordId = interaction.user.id;
    const hours = interaction.options.getInteger('hours') || 1;

    try {
      await interaction.deferReply();

      const result = await buyPro(discordId, hours);
      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Pro Activated!')
          .setDescription(`**${hours} hour${hours > 1 ? 's' : ''}** of Pro access`)
          .addFields(
            { name: 'Expires', value: `<t:${Math.floor(new Date(result.proUntil).getTime() / 1000)}:R>`, inline: true },
            { name: 'Coins Left', value: `**${result.coins}**`, inline: true },
          )
          .setColor(0x2b2d31)
          .setThumbnail(interaction.user.displayAvatarURL());
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ ${result.message}`,
        });
      }
    } catch (error) {
      console.error('[BUY-PRO ERROR]', error.message);
      const msg = { content: '❌ Error buying Pro. Make sure the server is running.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }

  // ─── /coins-leaderboard ──────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'coins-leaderboard') {
    try {
      await interaction.deferReply();

      const result = await getCoinsLeaderboard();
      const entries = result.entries || [];

      if (entries.length === 0) {
        return interaction.editReply({ content: '🏆 No one has earned coins yet. Use `/daily` to start!' });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Coins Leaderboard')
        .setDescription(entries.map((e, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
          return `${medal} <@${e.discord_id}> — **${e.coins}** coins (${e.total_earned} earned)`;
        }).join('\n'))
        .setColor(0x2b2d31)
        .setFooter({ text: 'Use /daily for quests • /buy-pro to spend coins' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[COINS-LB ERROR]', error.message);
      const msg = { content: '❌ Error loading leaderboard. Make sure the server is running.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'rate') {
    try {
      await interaction.deferReply();
      const product = interaction.options.getString('product');
      const rating = interaction.options.getInteger('rating');
      const review = interaction.options.getString('review') || null;
      const discordId = interaction.user.id;

      const productNames = { basic: 'Basic Tweaks', pro: 'Pro Tweaks', extreme: 'Extreme Tweaks', precision: 'Precision Tweaks', power: 'Premium Power Plan', full: 'Full Optimization' };

      await dbQuery(
        'INSERT INTO product_ratings (product_id, discord_id, rating, review) VALUES ($1, $2, $3, $4) ON CONFLICT (product_id, discord_id) DO UPDATE SET rating = $3, review = $4',
        [product, discordId, rating, review]
      );

      const avgResult = await dbQuery(
        'SELECT COALESCE(AVG(rating), 0) as avg, COUNT(*) as count FROM product_ratings WHERE product_id = $1',
        [product]
      );
      const avg = parseFloat(avgResult.rows[0].avg).toFixed(1);
      const count = parseInt(avgResult.rows[0].count);

      const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
      const embed = new EmbedBuilder()
        .setTitle(`⭐ Rating Submitted — ${productNames[product]}`)
        .setDescription(`You rated **${productNames[product]}** ${stars}`)
        .addFields(
          { name: 'Your Rating', value: `${rating}/5`, inline: true },
          { name: 'Product Average', value: `${avg}/5 (${count} reviews)`, inline: true }
        )
        .setColor(rating >= 4 ? 0x00e676 : rating >= 3 ? 0xfacc15 : 0xef4444)
        .setFooter({ text: 'Thanks for your feedback!' });

      if (review) embed.addFields({ name: 'Your Review', value: review });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[RATE ERROR]', error.message);
      const msg = { content: '❌ Error submitting rating. Make sure the server is running.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'deliver') {
    const ADMIN_IDS = ['1014494449809772544', '1520176133461512324', '1322475983386837006'];
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }
    await interaction.deferReply();
    const username = interaction.options.getString('username');
    const product = interaction.options.getString('product');

    const PRODUCTS = {
      basic:     { name: 'Basic Tweaks',       tier: 'PRO' },
      pro:       { name: 'Pro Tweaks',          tier: 'PRO' },
      extreme:   { name: 'Extreme Tweaks',      tier: 'PREMIUM' },
      precision: { name: 'Precision Tweaks',    tier: 'PRO' },
      power:     { name: 'Premium Power Plan',  tier: 'PRO' },
      full:      { name: 'Full Optimization',   tier: 'PREMIUM' },
    };

    const p = PRODUCTS[product];
    if (!p) return interaction.editReply({ content: '❌ Invalid product.' });

    try {
      const key = generateKeyLocal(p.tier);
      const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

      await dbQuery(
        'INSERT INTO keys_table (key, tier, expiry, redeemed, created_at) VALUES ($1, $2, $3, false, NOW()::TEXT)',
        [key, p.tier, expiry]
      );

      await dbQuery(`
        CREATE TABLE IF NOT EXISTS pending_deliveries (
          id SERIAL PRIMARY KEY,
          discord_username TEXT,
          key TEXT,
          product_id TEXT,
          claimed BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT NOW()::TEXT
        )
      `);
      await dbQuery(
        'INSERT INTO pending_deliveries (discord_username, key, product_id) VALUES ($1, $2, $3)',
        [username, key, product]
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ Key Delivered')
        .setDescription(`Key for **${p.name}** generated and stored.\n\n**Key:** ||${key}||\n**Buyer:** ${username}\n**Tier:** ${p.tier}\n**Expires:** ${expiry}`)
        .setColor(0x00e676);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[DELIVER ERROR]', err.message);
      await interaction.editReply({ content: '❌ Error generating key.' });
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'claim') {
    await interaction.deferReply({ ephemeral: true });
    const username = interaction.user.username;

    try {
      // Check pending_orders (PayPal purchases)
      const orders = await dbQuery(
        'SELECT download_token, product_id, product_name, tier, price FROM pending_orders WHERE discord_username = $1 ORDER BY created_at DESC',
        [username]
      );

      if (orders.rows.length === 0) {
        return interaction.editReply({ content: '❌ No purchases found. Buy at https://zylenofficial.github.io/choatix-v2/products.html' });
      }

      const downloadBase = 'https://zylenofficial.github.io/choatix-v2/download.html';
      const lines = orders.rows.map(o => {
        const url = `${downloadBase}?token=${o.download_token}&user=${encodeURIComponent(username)}&products=${o.product_id}`;
        return `**${o.product_name}** (${o.tier}) — €${o.price}\n${url}`;
      });

      const embed = new EmbedBuilder()
        .setTitle('📦 Your Downloads')
        .setDescription(lines.join('\n\n'))
        .setColor(0x00e676)
        .setFooter({ text: 'Click links to download. Run as Administrator for tweaks to apply.' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[CLAIM ERROR]', err.message);
      await interaction.editReply({ content: '❌ Error fetching purchases.' });
    }
  }
});

let pool = null;

async function dbQuery(text, params) {
  if (!pool) return { rows: [] };
  return pool.query(text, params);
}

async function getQuestsToday(discordId) {
  const today = new Date().toISOString().split('T')[0];
  const quests = await dbQuery('SELECT * FROM daily_quests WHERE active = true ORDER BY id');
  const userQuests = await dbQuery('SELECT * FROM user_quests WHERE discord_id = $1 AND date = $2', [discordId, today]);
  const userMap = {};
  userQuests.rows.forEach(uq => { userMap[uq.quest_id] = uq; });
  return quests.rows.map(q => {
    const uq = userMap[q.id] || { progress: 0, completed: false, claimed: false };
    return { ...q, progress: uq.progress, completed: uq.completed, claimed: uq.claimed };
  });
}

async function claimQuest(discordId, questId) {
  const today = new Date().toISOString().split('T')[0];
  const uq = await dbQuery('SELECT * FROM user_quests WHERE discord_id = $1 AND quest_id = $2 AND date = $3', [discordId, questId, today]);
  if (uq.rows.length === 0) return { success: false, message: 'Quest not found' };
  if (!uq.rows[0].completed) return { success: false, message: 'Quest not completed' };
  if (uq.rows[0].claimed) return { success: false, message: 'Already claimed' };

  const quest = await dbQuery('SELECT * FROM daily_quests WHERE id = $1', [questId]);
  if (quest.rows.length === 0) return { success: false, message: 'Quest not found' };

  const reward = quest.rows[0].reward;
  await dbQuery('UPDATE user_quests SET claimed = true WHERE id = $1', [uq.rows[0].id]);
  await dbQuery(`INSERT INTO user_coins (discord_id, coins, total_earned) VALUES ($1, $2, $2) ON CONFLICT (discord_id) DO UPDATE SET coins = user_coins.coins + $2, total_earned = user_coins.total_earned + $2`, [discordId, reward]);
  const balance = await dbQuery('SELECT coins FROM user_coins WHERE discord_id = $1', [discordId]);
  return { success: true, coins: balance.rows[0]?.coins || 0 };
}

async function getCoins(discordId) {
  const r = await dbQuery('SELECT * FROM user_coins WHERE discord_id = $1', [discordId]);
  if (r.rows.length === 0) return { coins: 0, total_earned: 0 };
  return { coins: r.rows[0].coins, total_earned: r.rows[0].total_earned };
}

async function getProTime(discordId) {
  const r = await dbQuery('SELECT * FROM user_pro_time WHERE discord_id = $1', [discordId]);
  if (r.rows.length === 0) return { active: false };
  const active = new Date(r.rows[0].pro_until) > new Date();
  return { active, proUntil: r.rows[0].pro_until };
}

async function buyPro(discordId, hours) {
  const cost = hours * 100;
  const userCoins = await dbQuery('SELECT * FROM user_coins WHERE discord_id = $1', [discordId]);
  if (userCoins.rows.length === 0 || userCoins.rows[0].coins < cost) {
    return { success: false, message: `Not enough coins. Need ${cost}, have ${userCoins.rows[0]?.coins || 0}` };
  }

  await dbQuery('UPDATE user_coins SET coins = coins - $1 WHERE discord_id = $2', [cost, discordId]);
  const existing = await dbQuery('SELECT * FROM user_pro_time WHERE discord_id = $1', [discordId]);
  const now = new Date();
  const base = existing.rows.length > 0 && new Date(existing.rows[0].pro_until) > now
    ? new Date(existing.rows[0].pro_until) : now;
  const proUntil = new Date(base.getTime() + hours * 3600000);

  await dbQuery(`INSERT INTO user_pro_time (discord_id, pro_until, activated_at) VALUES ($1, $2, $3) ON CONFLICT (discord_id) DO UPDATE SET pro_until = $2, activated_at = $3`, [discordId, proUntil.toISOString(), now.toISOString()]);

  const balance = await dbQuery('SELECT coins FROM user_coins WHERE discord_id = $1', [discordId]);
  return { success: true, proUntil: proUntil.toISOString(), coins: balance.rows[0]?.coins || 0 };
}

async function getCoinsLeaderboard() {
  const r = await dbQuery('SELECT discord_id, coins, total_earned, ROW_NUMBER() OVER (ORDER BY coins DESC) as rank FROM user_coins ORDER BY coins DESC LIMIT 20');
  return { entries: r.rows };
}

async function updateQuestProgress(discordId, type, amount) {
  const today = new Date().toISOString().split('T')[0];
  const quests = await dbQuery('SELECT * FROM daily_quests WHERE active = true AND type = $1', [type]);
  for (const quest of quests.rows) {
    await dbQuery(`INSERT INTO user_quests (discord_id, quest_id, progress, completed, claimed, date) VALUES ($1, $2, 0, false, false, $3) ON CONFLICT (discord_id, quest_id, date) DO NOTHING`, [discordId, quest.id, today]);
    const uq = await dbQuery('SELECT * FROM user_quests WHERE discord_id = $1 AND quest_id = $2 AND date = $3 AND completed = false', [discordId, quest.id, today]);
    if (uq.rows.length > 0) {
      const newProgress = uq.rows[0].progress + amount;
      const completed = newProgress >= quest.target;
      await dbQuery('UPDATE user_quests SET progress = $1, completed = $2 WHERE id = $3', [newProgress, completed, uq.rows[0].id]);
    }
  }
}

// ─── Message tracking for daily quests ──────────────────────
const chatCooldown = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const userId = message.author.id;
  const now = Date.now();

  // Cooldown: only track every 5 seconds per user
  if (chatCooldown.has(userId) && now - chatCooldown.get(userId) < 5000) return;
  chatCooldown.set(userId, now);

  try {
    await updateQuestProgress(userId, 'chat', 1);
  } catch {}
});

// Track command usage for quests
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    try {
      await updateQuestProgress(interaction.user.id, 'commands', 1);
    } catch {}
  }
});

client.on('error', (err) => {
  console.error('[BOT] Client error:', err.message);
});

client.on('warn', (info) => {
  console.warn('[BOT] Warning:', info.message || info);
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

process.on('uncaughtException', (err) => {
  console.error('[BOT] Uncaught exception:', err);
});

startBot();

module.exports = { start: (expressApp, dbPool) => {
  pool = dbPool;
  console.log('[BOT] Pool connected from server');
}};
