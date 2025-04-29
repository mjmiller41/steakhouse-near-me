import DB from './lib/db.js'
import { saveObjectToFile } from './lib/fileIO.js'
import { Place } from './lib/Place.js'
import { config } from './lib/config.js'

async function run() {
  const db = new DB()
  const { rows, rowCount } = await db.getAllPlaces('0')
  console.log(`${rowCount} rows read from database.`)

  const places = []
  for (const row of rows) {
    const place = new Place(row)
    places.push(place)
  }
  const filename = `${config.projectId}.json`
  saveObjectToFile(filename, places)
}

run()
