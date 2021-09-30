require('dotenv').config();

const csv = require('csvtojson');
const slugid = require('slugid');
const { findCustomer, updateCustomer } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-update-customers.csv`)
.then((rows) => {
  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    q.push((cb) => {
      findCustomer(row.email, 'email')
      .then((matches) => {
        matches = matches.data;

        if(matches.length) {
          console.log(`SUCCESS - ROW ${rowIdx}: Found a match for customer with email ${row.email}. Attempting to update profile`);

          //There should only ever be one profile that has this email in Gladly
          let customerObject = matches[0];
          customerObject.name = row.name.trim(); //update name only

          updateCustomer(customerObject)
          .then(() => {
            console.log(`SUCCESS - ROW ${rowIdx}: Updated customer profile with payload ${JSON.stringify(customerObject)}`);

            cb();
          })
          .catch((e) => {
            console.log(`ERROR - ROW ${rowIdx}: Could not update customer profile with payload ${JSON.stringify(customerObject)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

            cb();
          })
        } else {
          console.log(`ERROR - ROW ${rowIdx}: Could not find customer with email ${row.email}. This profile does not exist in Gladly`);

          cb();
        }
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not find customer with email ${row.email} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

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
  console.log(`Could not open CSV file to update customers due to ${JSON.stringify(e)}`);
});
