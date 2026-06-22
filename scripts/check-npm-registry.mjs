/**
 * NPM Registry Security Check Script
 * -------------------------------------------------------------
 * Ensures that the NPM registry used during installation is the official,
 * approved registry (registry.npmjs.org) to prevent dependency hijacking.
 */

const allowedRegistry = 'https://registry.npmjs.org/'

// Normalizes NPM registry URLs to have consistent trailing slashes for comparison
function normalizeRegistry(value) {
  if (!value) return ''
  const trimmed = value.trim()
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

const configuredRegistry = normalizeRegistry(
  process.env.npm_config_registry || process.env.NPM_CONFIG_REGISTRY
)

if (configuredRegistry && configuredRegistry !== allowedRegistry) {
  console.error(
    `[security] Refusing npm install with unapproved registry: ${configuredRegistry}`
  )
  console.error(`[security] Expected registry: ${allowedRegistry}`)
  console.error('[security] Remove NPM_CONFIG_REGISTRY or update .npmrc before installing.')
  process.exit(1)
}

console.log(`[security] npm registry check passed (${configuredRegistry || allowedRegistry})`)
