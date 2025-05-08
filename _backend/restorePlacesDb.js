import { initPlacesTable } from './db/init.js'
import { upsertPlace } from './db/upsertPlace.js'
import { config } from './lib/config.js'
import { readObjectFromFile } from './lib/utils/fileIO.js'
import { Place } from './lib/Place.js'

async function run() {
  const filename = `${config.projectId}.json`
  const filePlaces = await readObjectFromFile(filename)
  console.log(`${filePlaces.length} places read from file.`)

  await initPlacesTable()
  let upsertCount = 0
  for (const place of filePlaces) {
    try {
      await upsertPlace(new Place(place))
      upsertCount++
    } catch (error) {
      console.error(error)
      continue
    }
  }

  console.log(`${upsertCount} of ${filePlaces.length} file places upserted`)
}

run()
