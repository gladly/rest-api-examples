require('dotenv').config();

const csv = require('csvtojson');
const { createTopic } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 2
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-new-topics.csv`)
.then((rows) => {
  for (let rowIdx in rows) {
    let row = rows[rowIdx];

    if (row.disabled) {
      row.disabled = row.disabled === "true" ? true : false; //The `disabled` field expects a boolean type, if present
    }
    // Note that the sample data used here illustrates that several fields are optional, only `name` is required
    // An id will be created by Gladly, if a Topic is submitted without one. Here, we specify our id's for the sake of our update-topics script.
    const topicObject = {};
    for (const field in row) {
      if (row[field]) {
        topicObject[field] = row[field];
      }
    }
  
    q.push((cb) => {
      createTopic(topicObject)
      .then(() => {
        console.log(`SUCCESS - ROW ${rowIdx}: Created Topic with ID ${topicObject.id} and payload ${JSON.stringify(topicObject)}`);

        cb();
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not create Topic with payload ${JSON.stringify(topicObject)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

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