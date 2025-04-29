import 'dotenv/config'

const config = {
  devMode:
    process.env.NODE_ENV !== 'production' ||
    process.env.JEKYLL_ENV !== 'production',
  googleApiKey: process.env.GOOGLE_API_KEY,
  placesTableName: process.env.PLACES_TABLE_NAME ?? 'places',
  projectName: process.env.PROJECT_NAME ?? '',
  projectId: process.env.PROJECT_ID ?? '',
  updateInterval: process.env.UPDATE_INTERVAL ?? '0',
  costLimit: parseInt(process.env.COST_LIMIT) ?? 190,
  searchRadius: parseInt(process.env.SEARCH_RADIUS) ?? 5000,
  updateInterval: process.env.UPDATE_INTERVAL ?? '6 months'
}

console.log(`DevMode: ${config.devMode}`)

export { config }
