require('dotenv').config();

const csv = require('csvtojson');
const slugid = require('slugid');
const { createTask, listAgents, listInboxes } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 5
});

//Load CSV file
Promise.all([
  csv().fromFile(`${__dirname}/sample-new-tasks.csv`),
  listInboxes(),
  listAgents()
])
.then((promiseResults) => {
  const rows = promiseResults[0];
  const inboxes = promiseResults[1].data;
  const agents = promiseResults[2].data;

  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    let inbox = inboxes.filter(inbox => inbox.name == row['inboxName']);
    let agent = agents.filter(agent => agent.emailAddress == row['agentEmail']);

    if(row['agentEmail'] && !agent.length) {
      console.log(`ERROR - ROW ${rowIdx}: Agent witih email ${row['agentEmail']} was specified in CSV file but could not be found in Gladly`);
    } else if (!inbox.length) { //inbox is always required
      console.log(`ERROR - ROW ${rowIdx}: Inbox witih name ${row['inboxName']} was specified in CSV file but could not be found in Gladly`);
    } else {
      let inboxId = inbox[0].id;
      let agentId = agent.length ? agent[0].id : null;

      let taskObject = {
        id: slugid.nice(),
        assignee: {
          inboxId: inboxId,
          agentId: agentId
        },
        body: row['task'],
        dueAt: row['dueAt'],
        customer: {
          emailAddress: row['email']
        }
      };

      q.push((cb) => {
        createTask(taskObject)
        .then(() => {
          console.log(`SUCCESS - ROW ${rowIdx}: Created task with ID ${taskObject.id} and payload ${JSON.stringify(taskObject)}`);

          cb();
        })
        .catch((e) => {
          console.log(`ERROR - ROW ${rowIdx}: Could not create task with payload ${JSON.stringify(taskObject)} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

          cb();
        })
      });
    }
  }

  console.log(`\n\nStarting API calls\n\n`);
  q.start(() => {
    console.log(`\n\nFinished processing file`)
  });
})
.catch((e) => {
  //Something went wrong opening the CSV file
  console.log(`Could not open CSV file to create new tasks due to ${JSON.stringify(e)}`);
});
