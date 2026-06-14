const allowedRegistry = 'https://registry.npmjs.org/'

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
