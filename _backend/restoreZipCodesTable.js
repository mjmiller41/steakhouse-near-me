import { insertZipCodes } from './db/queries/zipCode.js'
import csv from 'csv-parser'
import fs from 'fs'

async function run() {
  const results = []
  fs.createReadStream('/home/michael/zip_codes.csv')
    .pipe(csv())
    .on('data', data => results.push(data))
    .on('end', async () => {
      console.log(results)
      await insertZipCodes(results)
    })
}

run()
