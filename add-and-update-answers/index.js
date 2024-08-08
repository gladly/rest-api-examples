require('dotenv').config();

const _ = require('lodash');
const csv = require('csvtojson');
const slugid = require('slugid');
const { listAudiences, addAnswer, addOrUpdateAnswerContent, updateAnswer } = require('../util/api');

//Keep note of rate limits: https://developer.gladly.com/rest/#section/Default-Rate-Limit
const queue = require('queue');
let q = new queue({
  concurrency: 1
});

let audiences = [];

//Load CSV file
listAudiences()
.then((au) => {
  audiences = au.data;

  return csv().fromFile(`${__dirname}/answers.csv`)
})
.then((rows) => {
  for(let rowIdx in rows) {
    let row = rows[rowIdx];

    let audienceIds = [];
    let audienceNames = row['audience'].split(',');

    for(let i = 0; i < audienceNames.length; i++) {
      let thisAudienceId = _.find(audiences, (audience) => {
        return audience.name == audienceNames[i].trim();
      });

      if(thisAudienceId) {
        audienceIds.push(thisAudienceId.id);
      }
    }

    q.push((cb) => {
      addAnswer({
        name: row.name,
        description: row.description,
        audienceIds: audienceIds
      }).then((r) => {
        let newAnswerId = r.data.id;

        addOrUpdateAnswerContent(newAnswerId, row.language.toLowerCase().trim(), 'public', {
          bodyHtml: row.public_answer_content,
          title: row.public_answer_title
        }).then(() => {
          //was not able to add answer for some reason
          console.log(`${rowIdx},${row.name},,add,${newAnswerId}`);
           
          cb();
        }).catch((e) => {
           //was not able to add answer for some reason
           console.log(`${rowIdx},${row.name},${JSON.stringify(e.response.data.errors)},add,${newAnswerId}`);

          cb();
        });
      }).catch((e) => {
        if(e.response.data.errors[0].code == 'taken') {
          //TODO: Replace this with upcoming duplicate ID placement
          let actualAnswerId = e.response.data.errors[0].meta.existingAnswerId;

          updateAnswer(actualAnswerId, {
            "description": row.description,
            "audienceIds": audienceIds
          }).then(() => {
            addOrUpdateAnswerContent(actualAnswerId, row.language.toLowerCase().trim(), 'public', {
              bodyHtml: row.public_answer_content,
              title: row.public_answer_title
            }).then(() => {
              //was not able to update answer for some reason
              console.log(`${rowIdx},${row.name},,update,${actualAnswerId}`);
               
              cb();
            }).catch((e) => {
               //was not able to update answer for some reason
               console.log(`${rowIdx},${row.name},${JSON.stringify(e.response.data.errors)},update,${actualAnswerId}`);
    
              cb();
            });
          }).catch((e) => {
            //was not able to update answer for some reason
            console.log(`${rowIdx},${row.name},${JSON.stringify(e.response.data.errors)},update,${actualAnswerId}`);

            cb();
          });
        } else {
          //was not able to add answer for some reason
          console.log(`${rowIdx},${row.name},${JSON.stringify(e.response.data.errors)},add,`);

          cb();
        }
      })
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
