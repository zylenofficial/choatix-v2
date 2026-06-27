const SECRET = 'choatix-v2-secret-2024'
const PREFIX = 'CHTX'

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function generateChecksum(tier, expiry, nonce) {
  const data = `${tier}:${expiry}:${nonce}:${SECRET}`
  const hash = hashCode(data)
  return hash.toString(36).toUpperCase().padStart(4, '0')
}

function generateKey(tier, expiryDays = 365) {
  const expiry = new Date(Date.now() + expiryDays * 86400000).toISOString().split('T')[0]
  const nonce = Math.random().toString(36).substring(2, 6).toUpperCase()
  const checksum = generateChecksum(tier, expiry, nonce)
  return `${PREFIX}-${tier.substring(0, 4)}-${nonce}-${checksum}`
}

const tier = process.argv[2] || 'PRO'
const count = parseInt(process.argv[3]) || 5

if (!['PRO', 'PREMIUM'].includes(tier)) {
  console.log('Usage: node generate-keys.js [PRO|PREMIUM] [count]')
  process.exit(1)
}

console.log(`\n${count} ${tier} keys:\n`)
for (let i = 0; i < count; i++) {
  console.log(generateKey(tier))
}
console.log('')
