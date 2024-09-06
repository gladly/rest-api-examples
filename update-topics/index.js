require('dotenv').config();

const csv = require('csvtojson');
const { updateTopic } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-update-topics.csv`)
.then((rows) => {
  for (let rowIdx in rows) {
    let row = rows[rowIdx];

    if (row.disabled) {
      row.disabled = row.disabled === "true" ? true : false; //The `disabled` field expects a boolean type, if present
    }
  
    const topicObject = {};
    for (const field in row) {
      if (row[field] || typeof row[field] === "boolean") { //We have to check here for setting `disabled` to `false` on update
        topicObject[field] = row[field];
      }
    }

    const topicId = row.id;
    q.push((cb) => {
      updateTopic(topicId, topicObject)
      .then(() => {
        console.log(`SUCCESS - ROW ${rowIdx}: Updated Topic with ID ${topicObject.id} and payload ${JSON.stringify(topicObject)}`);

        cb();
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not update Topic with payload ${JSON.stringify(topicObject)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

        cb();
      })
    });
  }
  
  console.log(`\n\nStarting API calls\n\n`);
  q.start(() => {
    console.log(`\n\nFinished processing file`)
  });
}
)
.catch((e) => {
  //Something went wrong opening the CSV file
  console.log(`Could not open CSV file to create new Topics due to ${JSON.stringify(e)}`);
});