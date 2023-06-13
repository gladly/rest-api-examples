require('dotenv').config();

const csv = require('csvtojson');
const { redactConversationItem } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-redact-calls.csv`)
  .then((rows) => {
    for (let rowIdx in rows) {
      let row = rows[rowIdx];
      q.push((cb) => {
        redactConversationItem(row.itemid)
          .then((r) => {
            console.log(`SUCCESS - ROW ${rowIdx}: redacted conversation ${row.itemid}`);
            cb();
          })
          .catch((e) => {
            console.log(`ERROR - ROW ${rowIdx}: Could not redact item with ID ${row.itemid} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);
            cb();
          })
      })
    }

    console.log(`Starting API calls\n\n`);
    q.start(() => {
      console.log(`\n\nFinished processing file`)
    });
  })
  .catch((e) => {
    //Something went wrong opening the CSV file
    console.log(`Could not open CSV file to redact calls due to ${JSON.stringify(e)}`);
  });
