const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config()

// Import the local configuration JSON file
const localConf = require('../../localeConf.json')

// Get the main URL from environment variables
const mainUrl = process.env.URL

if (!mainUrl) {
  throw new Error('The main URL is not defined in the environment variables.')
}

// Initialize the comment for auto-generated rules
const autoGeneratedComment =
  '# --- AUTO-GENERATED RULES FROM writeNetlifyRedirects.js ---'

// Helper function to add redirect rules
const addRedirectRule = (from, to) => {
  return `[[redirects]]
from = "${from}"
to = "${to}"
status = 200
force = true

`
}

// Generate redirect rules
let generatedRules = `${autoGeneratedComment}\n\n`

Object.keys(localConf).forEach((namespace) => {
  const config = localConf[namespace]

  // Add redirect rules for each domain
  if (config.domains && config.domains.length > 0) {
    config.domains.forEach((domain) => {
      generatedRules += addRedirectRule(
        `${domain}/_next/*`,
        `${mainUrl}/_next/:splat`
      )
      generatedRules += addRedirectRule(
        `${domain}/adds/*`,
        `${mainUrl}/adds/:splat`
      )
      generatedRules += addRedirectRule(
        `${domain}/api/*`,
        `${mainUrl}/api/:splat`
      )
      generatedRules += addRedirectRule(
        `${domain}`,
        `${mainUrl}/default/${namespace}`
      )
      generatedRules += addRedirectRule(
        `${domain}/*`,
        `${mainUrl}/default/${namespace}/:splat`
      )

      // Add redirect rules for each language
      if (config.langs && config.langs.length > 0) {
        config.langs.forEach((locale) => {
          generatedRules += addRedirectRule(
            `${domain}/${locale}`,
            `${mainUrl}/${locale}/${namespace}`
          )
          generatedRules += addRedirectRule(
            `${domain}/${locale}/*`,
            `${mainUrl}/${locale}/${namespace}/:splat`
          )
        })
      }
    })
  }
})

// Read the existing netlify.toml file
const netlifyTomlPath = path.join(__dirname, '../../netlify.toml')
let netlifyTomlContent = fs.existsSync(netlifyTomlPath)
  ? fs.readFileSync(netlifyTomlPath, 'utf8')
  : ''

// Check if the auto-generated comment exists
const commentIndex = netlifyTomlContent.indexOf(autoGeneratedComment)

if (commentIndex !== -1) {
  // If the comment exists, remove everything under it
  netlifyTomlContent = netlifyTomlContent.substring(0, commentIndex);
} else if (netlifyTomlContent !== '') {
  // If the file exists and is not empty, ensure there's a line break before appending the comment
  netlifyTomlContent += '\n';
}


// Append the generated rules to the content
netlifyTomlContent += generatedRules

// Write the updated content back to the netlify.toml file
fs.writeFileSync(netlifyTomlPath, netlifyTomlContent, 'utf8')

console.log('netlify.toml has been updated with the redirect rules.')
