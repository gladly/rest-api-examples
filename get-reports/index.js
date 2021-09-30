require('dotenv').config();

const csv = require('csvtojson');
const { generateReport, generateWorkSessionReport } = require('../util/api');

const contactExportPayload = {
  "metricSet": "ContactExportReport",
  "timezone": "America/Los_Angeles",
  "startAt": "2021-09-28",
  "endAt": "2021-09-28"
};

const agentTimestampsPayload = {
  "metricSet": "AgentTimestampsReport",
  "timezone": "America/Los_Angeles",
  "startAt": "2021-09-28",
  "endAt": "2021-09-28",
  "filters": { }
};

const workSessionsPayload = {
  startAtTime: '2021-09-28T00:00-07:00',
  endAtTime: '2021-09-29T00:00-07:00'
};

//Generate reports one at a time - makes it easier to adhere to concurrency rate limiting across your organization
generateWorkSessionReport(workSessionsPayload)
.then((workSessions) => {
  return csv().fromString(workSessions.data)
})
.then((workSessions) => {
  let workSessionHandleTime = workSessions.reduce((total, workSession) => parseFloat(total.work_session_handle_time) + parseFloat(workSession.work_session_handle_time));

  console.log(`Detected ${workSessionHandleTime} of work session handle time for contacts ended between 2021-09-28T00:00-07:00 and 2021-09-29T00:00-07:00. Used payload ${JSON.stringify(workSessionsPayload)}`);

  return true;
})
.then(() => {
  return generateReport(contactExportPayload);
})
.then((contactExportReport) => {
  return csv().fromString(contactExportReport.data)
})
.then((contactExportReport) => {
  let emailContactsCreated = contactExportReport.filter((contact) => contact['Channel'] == 'EMAIL');

  console.log(`Detected ${emailContactsCreated.length} EMAIL contact(s) created on 09/28/21 America/Los_Angeles timezone. Used payload ${JSON.stringify(contactExportPayload)}`)

  return true;
})
.then(() => {
  return generateReport(agentTimestampsPayload);
})
.then((agentTimestampsReport) => {
  return csv().fromString(agentTimestampsReport.data)
})
.then((agentTimestampsReport) => {
  let loggedInEvents = agentTimestampsReport.filter((agentEvent) => agentEvent['Type'] == 'AGENT_STATUS/LOGGED_IN');

  console.log(`Detected ${loggedInEvents.length} agent logged in event(s) on 09/28/21 America/Los_Angeles timezone. Used payload ${JSON.stringify(agentTimestampsPayload)}`)

  return true;
})
.catch((e) => {
  console.log(`ERROR - could not download reports due to ${JSON.stringify(e)}`);
})
