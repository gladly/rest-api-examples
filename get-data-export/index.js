require('dotenv').config();
const readline = require('readline');

const { listJobs, getFile } = require('../util/api');

listJobs('COMPLETED')
.then((completedJobs) => {
  //Get the latest job
  const latestJob = completedJobs.data.reduce((prev, current) => {
    let prevUpdatedDate = new Date(prev.updatedAt).getTime();
    let currentUpdatedDate = new Date(current.updatedAt).getTime();

    return (prevUpdatedDate > currentUpdatedDate) ? prev : current
  }, 0);

  getFile(latestJob.id, 'conversation_items.jsonl', '/tmp/conversation_items.jsonl')
  .then(() => {
    let lineReader = require('readline').createInterface({
      input: require('fs').createReadStream('/tmp/conversation_items.jsonl')
    });

    lineReader.on('line', function (line) {
      console.log(`Got line from conversation_items.jsonl file: ${line}`);
    });
  }).catch((e) => {
    console.log(`ERROR: Could not download files for job ID ${latestJob.id} due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);
  });
})
.catch((e) => {
  console.log(`ERROR: Could not retrieve completed jobs due to ${JSON.stringify(e.response.data)} and HTTP status code ${e.response.status}`);
});
