require("dotenv").config();

const csv = require("csvtojson");
const { findCustomer, deleteCustomer } = require("../util/api");

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require("queue");
const q = new queue({
  concurrency: 5,
});

//Load CSV file
csv()
  .fromFile(`${__dirname}/sample-new-customers.csv`)
  .then((rows) => {
    for (const rowIdx in rows) {
      const row = rows[rowIdx];

      q.push((cb) => {
        findCustomer(row.email, "email") //can also be looked up with phone number, e.g. `findCustomer(row.phone, "phoneNumber")`
          .then((matches) => {
            matches = matches.data;

            if (matches.length) {
              console.log(
                `SUCCESS - ROW ${rowIdx}: Found a match for customer with email ${row.email}. Attempting to delete profile`
              );
              //There should only ever be one profile that has this email in Gladly, and we only need their id to delete
              const customerId = matches[0].id;

              deleteCustomer(customerId)
                .then(() => {
                  console.log( `SUCCESS - ROW ${rowIdx}: Deleted customer profile with id ${customerId}` );

                  cb();
                })
                .catch((e) => {
                  console.log(`ERROR - ROW ${rowIdx}: Could not delete customer profile with id ${customerId} due to ${JSON.stringify(
                      e.response.data
                    )} and HTTP status code ${e.response.status}`
                  );

                  cb();
                });
            } else {
              console.log(`ERROR - ROW ${rowIdx}: Could not find customer with email ${row.email}. This profile does not exist in Gladly`);

              cb();
            }
          })
          .catch((e) => {
            console.log(`ERROR - ROW ${rowIdx}: Could not find customer with email ${row.email} due to ${JSON.stringify(
              e.response.data
            )} and HTTP status code ${e.response.status}`
            );

            cb();
          });
      });
    }

    console.log(`Starting API calls\n\n`);
    q.start(() => {
      console.log(`\n\nFinished processing file`);
    });
  })
  .catch((e) => {
    //Something went wrong opening the CSV file
    console.log(`Could not open CSV file to delete customers due to ${JSON.stringify(e)}`);
  });
