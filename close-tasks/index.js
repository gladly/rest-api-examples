require('dotenv').config();

const csv = require('csvtojson');
const { getTask, updateTask } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 1
});

//Load CSV file
csv().fromFile(`${__dirname}/sample-close-tasks.csv`)
.then((rows) => {
  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    q.push((cb) => {
      //Retrieve this conversation so that we can get its current inboxId and agentId assignment
      getTask(row['taskId'])
      .then((thisTask) => {
        thisTask = thisTask.data;

        updateTask(thisTask.id, {
          "assignee": {
            "inboxId": thisTask.assignee.inboxId, //stay assigned to the same inbox the task is currently in
            "agentId": thisTask.assignee.agentId //stay assigned to the same agent the task is currently assigned to
          },
          "status": "CLOSED"
        })
        .then(() => {
          console.log(`SUCCESS - ROW ${rowIdx}: Closed task ID ${row['taskId']}`);

          cb();
        })
        .catch((e) => {
          console.log(`ERROR - ROW ${rowIdx}: Could not close task ID ${row['taskId']} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

          cb();
        });
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not retrieve conversation ID ${row['taskId']} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

        cb();
      });
    });
  }

  console.log(`\n\nStarting API calls\n\n`);
  q.start(() => {
    console.log(`\n\nFinished processing file`)
  });
})
.catch((e) => {
  //Something went wrong opening the CSV file
  console.log(`Could not open CSV file to close tasks due to ${JSON.stringify(e)}`);
});
