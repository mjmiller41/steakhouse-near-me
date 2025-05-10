import DB from './lib/db.js'
import { Place } from './lib/Place.js'
import { DEFAULT_PLACES_API_SKU_DATA, SKU_CATEGORIES, SKU_FUNCS } from './lib/Sku.js'
import { camelToSnakeCase } from './lib/utils.js'

async function run() {
  const db = new DB()
  const { rows, rowCount } = await db.getAllPlaces()
  console.log(`${rowCount} rows read from database.`)

  const places = []
  for (const row of rows) {
    const place = new Place(row)
    places.push(place)
  }

  const skus = DEFAULT_PLACES_API_SKU_DATA.filter(sku => {
    return sku.func !== SKU_FUNCS.TEXT_SEARCH && sku.category !== SKU_CATEGORIES.PHOTOS
  }).sort((a, b) => b.cost_level - a.cost_level)

  for (const place of places) {
    const currCategory = place.update_category
    let match = false
    iterSkus: for (const sku of skus) {
      const fields = sku.fields.map(field => camelToSnakeCase(field))
      iterFields: for (const field of fields) {
        if (place[field] !== null && place[field] !== undefined) {
          match = true
          if (place.update_category !== sku.category) {
            console.log(`${field}`)
            console.log(`\tMatch: ${sku.category} !== ${place.update_category}`)
          }
          place.update_category = sku.category
          break iterSkus
        }
      }
    }
  }
  db.end()
}

run()
