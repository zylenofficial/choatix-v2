const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const POWER_PLANS = {
  FREE: {
    name: 'CHOATIX Free',
    description: 'CHOATIX Free - Balanced gaming optimization',
    guid: null,
    settings: {
      'processorMaximum': 90,
      'processorMinimum': 5,
      'processorThrottlePolicy': 0,
      'diskIdleThreshold': 15,
      'powerStateDocked': 0,
    },
  },
  PRO: {
    name: 'CHOATIX Pro',
    description: 'CHOATIX Pro - High performance gaming',
    guid: null,
    settings: {
      'processorMaximum': 100,
      'processorMinimum': 100,
      'processorThrottlePolicy': 0,
      'diskIdleThreshold': 0,
      'powerStateDocked': 0,
    },
  },
  PREMIUM: {
    name: 'CHOATIX Premium',
    description: 'CHOATIX Premium - Ultimate performance',
    guid: null,
    settings: {
      'processorMaximum': 100,
      'processorMinimum': 100,
      'processorThrottlePolicy': 0,
      'diskIdleThreshold': 0,
      'coreParkingMax': 100,
      'coreParkingMin': 100,
      'powerStateDocked': 0,
    },
  },
};

const TIER_MAP = {
  FREE: 'FREE',
  PRO: 'PRO',
  PREMIUM: 'PREMIUM',
  'CHOATIX FREE': 'FREE',
  'CHOATIX PRO': 'PRO',
  'CHOATIX PREMIUM': 'PREMIUM',
};

class PowerPlanManager {
  constructor() {
    this.createdPlans = {};
  }

  async detectExistingPlans() {
    try {
      const { stdout } = await execAsync('powercfg /list', { timeout: 10000, windowsHide: true });
      const plans = {};
      const regex = /([0-9a-f-]{36})\s+\(([^)]+)\)/gi;
      let match;
      while ((match = regex.exec(stdout)) !== null) {
        const guid = match[1];
        const name = match[2];
        if (name.toLowerCase().startsWith('choatix')) {
          for (const [tier, config] of Object.entries(POWER_PLANS)) {
            if (name.toLowerCase().includes(tier.toLowerCase())) {
              plans[tier] = guid;
              POWER_PLANS[tier].guid = guid;
            }
          }
        }
      }
      this.createdPlans = plans;
      return plans;
    } catch (err) {
      console.error('[PowerPlan] Detect failed:', err.message);
      return {};
    }
  }

  async getActivePlan() {
    try {
      const { stdout } = await execAsync('powercfg /getactivescheme', { timeout: 5000, windowsHide: true });
      const match = stdout.match(/([0-9a-f-]{36})/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async createPlan(tier) {
    const config = POWER_PLANS[tier];
    if (!config) throw new Error(`Unknown tier: ${tier}`);

    if (this.createdPlans[tier]) {
      return this.createdPlans[tier];
    }

    const baseGuid = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';

    try {
      const { stdout } = await execAsync(
        `powercfg /duplicatescheme ${baseGuid}`,
        { timeout: 10000, windowsHide: true }
      );
      const match = stdout.match(/([0-9a-f-]{36})/i);
      if (!match) throw new Error('Failed to create power plan');
      const newGuid = match[1];

      await execAsync(
        `powercfg /changename "${newGuid}" "${config.name}" "${config.description}"`,
        { timeout: 10000, windowsHide: true }
      );

      POWER_PLANS[tier].guid = newGuid;
      this.createdPlans[tier] = newGuid;
      return newGuid;
    } catch (err) {
      console.error(`[PowerPlan] Create ${tier} failed:`, err.message);
      throw err;
    }
  }

  async configurePlan(tier, guid) {
    const config = POWER_PLANS[tier];
    if (!config || !guid) return;

    const commands = [];

    if (config.settings.processorMaximum !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_processor PROCTHROTTLEMAX ${config.settings.processorMaximum}`);
    }
    if (config.settings.processorMinimum !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_processor PROCTHROTTLEMIN ${config.settings.processorMinimum}`);
    }
    if (config.settings.processorThrottlePolicy !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_processor THROTTLING ${config.settings.processorThrottlePolicy}`);
    }
    if (config.settings.diskIdleThreshold !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_disk DISKIDLE ${config.settings.diskIdleThreshold}`);
    }
    if (config.settings.coreParkingMax !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_processor CPMAXCORES ${config.settings.coreParkingMax}`);
    }
    if (config.settings.coreParkingMin !== undefined) {
      commands.push(`powercfg /setacvalueindex ${guid} sub_processor CPMINCORES ${config.settings.coreParkingMin}`);
    }

    for (const cmd of commands) {
      try {
        await execAsync(cmd, { timeout: 10000, windowsHide: true });
      } catch {}
    }

    try {
      await execAsync(`powercfg /setactive ${guid}`, { timeout: 10000, windowsHide: true });
    } catch {}
  }

  async activateForTier(tier) {
    const normalizedTier = TIER_MAP[tier] || 'FREE';
    const config = POWER_PLANS[normalizedTier];
    if (!config) throw new Error(`Unknown tier: ${tier}`);

    await this.detectExistingPlans();

    let guid = this.createdPlans[normalizedTier];
    if (!guid) {
      guid = await this.createPlan(normalizedTier);
    }

    await this.configurePlan(normalizedTier, guid);

    return {
      success: true,
      tier: normalizedTier,
      planName: config.name,
      guid,
    };
  }

  async removeUnauthorizedPlans(currentTier) {
    const normalizedTier = TIER_MAP[currentTier] || 'FREE';
    const tierRank = { FREE: 1, PRO: 2, PREMIUM: 3 };
    const currentRank = tierRank[normalizedTier] || 1;

    await this.detectExistingPlans();

    for (const [tier, guid] of Object.entries(this.createdPlans)) {
      if (!guid) continue;
      const tierConfigRank = tierRank[tier] || 1;
      if (tierConfigRank > currentRank) {
        try {
          await execAsync(`powercfg /delete ${guid}`, { timeout: 10000, windowsHide: true });
          delete this.createdPlans[tier];
          delete POWER_PLANS[tier].guid;
        } catch {}
      }
    }
  }

  async getPlanStatus() {
    const active = await this.getActivePlan();
    await this.detectExistingPlans();
    const status = {};
    for (const [tier, config] of Object.entries(POWER_PLANS)) {
      status[tier] = {
        exists: !!this.createdPlans[tier],
        guid: this.createdPlans[tier] || config.guid,
        active: active === (this.createdPlans[tier] || config.guid),
      };
    }
    return status;
  }
}

module.exports = new PowerPlanManager();
