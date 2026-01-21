require('dotenv').config();

const csv = require('csvtojson');
const slugid = require('slugid');
const { getConversation, updateConversation, addTopics, listAgents } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 1
});

//Load CSV file
Promise.all([
  csv().fromFile(`${__dirname}/sample-close-conversations.csv`),
  listAgents()
])
.then((promiseResults) => {
  let rows = promiseResults[0];
  let agents = promiseResults[1];

  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    q.push((cb) => {
      //Retrieve this conversation so that we can get its current inboxId and agentId assignment
      getConversation(row['conversationId'])
      .then((thisConversation) => {
        thisConversation = thisConversation.data;

        //Add topics to the conversation - REQUIRED prior to closing
        addTopics(row['conversationId'], {
          "topicIds": [ row['topicId'] ]
        })
        .then(() => {
          let isValidAgent = false;
          for(let agent in agents) {
            if(agent.id == thisConversation.agentId) {
              isValidAgent = true;
            }
          }

          updateConversation(thisConversation.id, {
            "assignee": {
              "inboxId": thisConversation.inboxId, //stay assigned to the same inbox the conversation is currently in
              "agentId": isValidAgent ? thisConversation.agentId : null //stay assigned to the same agent the conversation is currently assigned to, unless agent is deactivated
            },
            "status": {
              "value": "CLOSED", //close the conversation
              "force": true //force the closure regardless of current conversation status (e.g.: requires a reply or not)
            }
          })
          .then(() => {
            console.log(`SUCCESS - ROW ${rowIdx}: Closed conversation ID ${row['conversationId']}`);

            cb();
          })
          .catch((e) => {
            console.log(`ERROR - ROW ${rowIdx}: Could not close conversation ID ${row['conversationId']} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

            cb();
          })
        })
        .catch((e) => {
          console.log(`ERROR - ROW ${rowIdx}: Could not add topic ID ${row['topicId']} to conversation ID ${row['conversationId']} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

          cb();
        });
      })
      .catch((e) => {
        console.log(`ERROR - ROW ${rowIdx}: Could not retrieve conversation ID ${row['conversationId']} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);

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
  console.log(`Could not open CSV file to create new tasks due to ${JSON.stringify(e)}`);
});
