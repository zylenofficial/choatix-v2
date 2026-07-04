import { LicenseTier } from '@/types'

const VALID_PREFIXES = ['CHOATIX', 'CHTX']

const BACKEND_URL = 'https://choatix-v2.onrender.com'

interface LicenseValidation {
  valid: boolean
  tier: LicenseTier | null
  error: string | null
}

export function validateLicenseKey(key: string): LicenseValidation {
  const cleaned = key.trim().toUpperCase().replace(/\s+/g, '')
  const parts = cleaned.split('-')

  if (parts.length !== 4 || !VALID_PREFIXES.includes(parts[0])) {
    return { valid: false, tier: null, error: 'Invalid format. Expected: CHTX-XXXX-XXXX-XXXX' }
  }

  const tierPrefix = parts[1]
  let tier: LicenseTier
  if (tierPrefix.startsWith('PRO')) tier = LicenseTier.PRO
  else if (tierPrefix.startsWith('PREM')) tier = LicenseTier.PREMIUM
  else return { valid: false, tier: null, error: 'Unknown tier in key' }

  const checksum = parts[3]
  if (!checksum || checksum.length < 4) {
    return { valid: false, tier: null, error: 'Invalid checksum' }
  }

  return { valid: true, tier, error: null }
}

const OWNER_DISCORD_ID = '1014494449809772544'

export async function verifyWithBackend(discordId: string): Promise<{ valid: boolean; tier: LicenseTier | null; error: string | null }> {
  if (discordId.trim() === OWNER_DISCORD_ID) {
    return { valid: true, tier: LicenseTier.PREMIUM, error: null }
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/license/${discordId}`)
    if (!res.ok) {
      return { valid: false, tier: null, error: 'No license found for this Discord ID' }
    }
    const data = await res.json()
    const tierMap: Record<string, LicenseTier> = {
      'FREE': LicenseTier.FREE,
      'PRO': LicenseTier.PRO,
      'PREMIUM': LicenseTier.PREMIUM,
      'PREMIUM_PRO': LicenseTier.PREMIUM,
    }
    const tier = tierMap[data.tier] || null
    return { valid: true, tier, error: null }
  } catch {
    return { valid: false, tier: null, error: 'Cannot reach license server.' }
  }
}

export async function activateByKeyAndDiscord(key: string, discordId: string): Promise<{ valid: boolean; tier: LicenseTier | null; error: string | null }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/license/verify-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.trim().toUpperCase(), discordId }),
    })
    const data = await res.json()
    if (!data.valid) {
      return { valid: false, tier: null, error: data.message || 'Invalid key' }
    }
    const tierMap: Record<string, LicenseTier> = {
      'FREE': LicenseTier.FREE,
      'PRO': LicenseTier.PRO,
      'PREMIUM': LicenseTier.PREMIUM,
      'PREMIUM_PRO': LicenseTier.PREMIUM,
    }
    const tier = tierMap[data.tier] || null
    return { valid: true, tier, error: null }
  } catch {
    return { valid: false, tier: null, error: 'Cannot reach license server.' }
  }
}
