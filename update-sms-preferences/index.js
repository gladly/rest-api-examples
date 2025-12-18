require('dotenv').config();

const csv = require('csvtojson');
const { getCustomerById, updateCustomer } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-update-preferences.csv`)
.then((rows) => {
  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    q.push((cb) => {
      getCustomerById(row.customer_id)
      .then((profile) => {
        profile = {
          id: profile.data.id,
          phones: profile.data.phones
        }

        if(profile) {
          //There should only ever be one profile that has this email in Gladly
          for(let l = 0; l < profile.phones.length; l++) {
            if(profile.phones[l].type == 'MOBILE') {
              profile.phones[l].smsPreference = "";
            }
          }

          updateCustomer(profile)
          .then(() => {
            console.log(`SUCCESS - ROW ${rowIdx}: Updated customer profile with payload ${JSON.stringify(profile)}`);

            cb();
          })
          .catch((e) => {
            console.log(`ERROR - ROW ${rowIdx}: Could not update customer profile with payload ${JSON.stringify(profile)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

            cb();
          })
        } else {
          console.log(`ERROR - ROW ${rowIdx}: Could not find customer with ID ${row.customer_id}. This profile does not exist in Gladly`);

          cb();
        }
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not find customer with ID ${row.customer_id} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

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
