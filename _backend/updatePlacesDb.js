import { fileURLToPath } from 'node:url'
import DB from './lib/db.js'
import { filterActiveSkus, filterUpdateSkus, SKU_FUNCS, SkuData } from './lib/Sku.js'
import { Place, sortPlacesByCostLevel } from './lib/Place.js'
import { getPlaceDetails } from './lib/google.js'
import { registerShutdown } from './lib/utils.js'
import { config } from './lib/config.js'

const db = new DB()
const saveDataCbs = []
async function updatePlacesDb() {
  registerShutdown(saveDataCbs)
  let places = []
  const { rows } = await db.getAllPlaces(
    (column = 'update_category'),
    (query = "!= 'atmosphere'"),
    (orderBy = 'DESC')
  )
  console.log(`Using database places data with ${rows.length} entries.`)
  const skuData = await SkuData.create()
  console.log(`Using database skuData with ${skuData.length} entries.`)

  // Data and CBs for unexpected shutdown event
  saveDataCbs.push({ data: skuData, cb: skuData.save })
  saveDataCbs.push({ places, cb: Place.savePlacesData })

  const placeDetailsSkus = skuData.skuObjs
    .filter(sku => sku.func === SKU_FUNCS.PLACE_DETAILS)
    .sort((a, b) => a.cost_level - b.cost_level)

  Place.validatePlaces(places)
  places = sortPlacesByCostLevel(places, placeDetailsSkus)

  let upsertCount = 0
  for (let place of places) {
    // Skus with free requests available
    const activeSkus = filterActiveSkus(placeDetailsSkus)
    const updateSkus = filterUpdateSkus(place.update_category, activeSkus)
    if (!updateSkus) continue

    const id = place.place_id
    const fields = updateSkus.map(sku => sku.fields).join(',')
    const currentSku = updateSkus.at(-1)
    if (place.update_category === currentSku.category) {
      console.log(
        `Skipping ${id} as it is already in the correct category: ${currentSku.category}`
      )
      continue
    }

    console.log(
      `Updating ${id} from ${place.update_category} to ${currentSku.category}`
    )
    let upserted
    const oldId = place.place_id
    try {
      if (config.testMode) console.log(`Test mode: Skipping API request for ${id}`)
      else {
        let details = await getPlaceDetails(id, fields)
        details.update_category = currentSku.category
        place = new Place({ ...place, ...details })
        if (place.place_id) upserted = await db.upsertPlace(place)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (place.place_id) currentSku.increment()
      if (upserted && upserted.rowCount === 1) upsertCount++
      if (!upserted || upserted.rowCount === 0) {
        console.error(`Failed to update place:\n ${place.place_id}`)
        continue
      } else if (oldId !== place.place_id && upserted?.rowCount > 0) {
        await db.deletePlace(oldId)
        console.log(`Place ${oldId} deleted successfully.`)
      }
      console.log(`Place ${place.place_id} updated successfully.`)
    }
    console.log(
      `${currentSku.description}: request ${currentSku.request_count} of ${currentSku.usage_caps[0]} free requests.`
    )
  }
  console.log(`${upsertCount} place(s) upserted.`)
  if (!config.testMode) await skuData.save()
  skuData.logSkuReport()
  db.end()
}

// Determine if cli or module execution
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url)
  if (process.argv[1] === modulePath) {
    // The module was executed directly from the command line
    await updatePlacesDb()
  } else {
    // The module was imported by another module
    console.log('Module is not running as main')
  }
}

export { updatePlacesDb }
