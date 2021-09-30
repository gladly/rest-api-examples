require('dotenv').config();

const csv = require('csvtojson');
const slugid = require('slugid');
const { createCustomer } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-new-customers.csv`)
.then((rows) => {
  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    let customerObject = {
      id: slugid.nice(), //generate a valid ID for this customer profile
      name: row.name.trim(),
      address: row.address.trim(),
      emails: [],
      phones: [],
      customAttributes: {}
    };

    for(let columnName in row) {
      if(/^email:\d+/.exec(columnName) && row[columnName].trim()) {
        customerObject.emails.push({
          original: row[columnName]
        });
      } else if (/^phone:\d+/.exec(columnName) && row[columnName].trim()) {
        customerObject.phones.push({
          original: row[columnName]
        });
      } else {
        let isCustomAttributeMatch = /^customAttribute:(.*)/.exec(columnName);

        if(isCustomAttributeMatch && isCustomAttributeMatch.length && isCustomAttributeMatch[1].trim() && row[columnName].trim()) {
          customerObject.customAttributes[isCustomAttributeMatch[1]] = row[columnName].trim();
        }
      }
    }

    q.push((cb) => {
      createCustomer(customerObject)
      .then(() => {
        console.log(`SUCCESS - ROW ${rowIdx}: Created customer with ID ${customerObject.id} and payload ${JSON.stringify(customerObject)}`);

        cb();
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not create customer with payload ${JSON.stringify(customerObject)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

        cb();
      })
    });
  }

  console.log(`Starting API calls\n\n`);
  q.start(() => {
    console.log(`\n\nFinished processing file`)
  });
})
.catch((e) => {
  //Something went wrong opening the CSV file
  console.log(`Could not open CSV file to create new customers due to ${JSON.stringify(e)}`);
});
