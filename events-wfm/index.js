require('dotenv').config();
const lineByLine = require('n-readlines');
const moment = require('moment-timezone');
const slugid = require('slugid');
const { getAgentEvents } = require('../util/api');

//Set time bucket / intervals to 30 minutes (very common for systems like Alvaria fka Aspect eWFM)
const TIME_BUCKET_IN_MINUTES = 30;

//Set the timezone explicitly
const TIMEZONE = 'America/Los_Angeles';

//Get Events data for today
let startAt = moment().tz(TIMEZONE).format('YYYY-MM-DDT00:00:00Z');
let endAt = moment().tz(TIMEZONE).format('YYYY-MM-DDTHH:mm:ssZ');
const saveToFileName = `/tmp/${slugid.nice()}.jsonl`;

getAgentEvents(startAt, endAt, ['CONTACT', 'AGENT_AVAILABILITY'], saveToFileName)
.then(() => {
  let holdTimeIntervalsByAgentId = generateHoldEvents(saveToFileName);
  let availabilityForVoice = generateAgentAvailabilityForChannel(saveToFileName, 'VOICE');

  console.log('Voice: Availability');
  console.log(availabilityForVoice);

  console.log('Voice: Hold Time');
  console.log(holdTimeIntervalsByAgentId);
})
.catch((e) => {
  console.log(e);
})

//This function will not correctly calculate availabiltiy time if the first availability update the agent performs
//does not appear in the Events API response
//For example, if we pull the Events API from 00:00 - 00:30
//And the agent went available for MESSAGING at 11:59 PM the day before
//We would never know the agent was available for MESSAGING during the 00:00 - 00:30 interval
//To combat this, we always pull raw event from 00:00 (start of the day) up until ending interval
//This Events API will ALWAYS return by timestamp ASC, hence there is no need to write extra code to sort
function generateAgentAvailabilityForChannel(rawEventsFile, channel) {
  let agentRawReport = {};

  const liner = new lineByLine(rawEventsFile);
  let rawEventLine;

  while(rawEventLine = liner.next()) {
    rawEventLine = rawEventLine.toString();
    let e = JSON.parse(rawEventLine);
    let thisTimestamp = moment(e).unix();

    //Only analyze channel (one of: PHONE, MAIL, MESSAGING)
    //availableFor is an Array of channels the Agent is available for
    if(e.content && e.type == 'AGENT_AVAILABILITY/UPDATED' && e.content.availableFor.indexOf(channel) != -1) {
      let availableStartAtForChannel = moment(e.content.occurredAt).unix();
      let availableEndAtForChannel = moment().unix();
      let thisAgentId = e.content.agentId;

      //Find the actual next availability change event
      let foundNextEvent = false;
      const liner2 = new lineByLine(rawEventsFile);
      let rawEventLine2;

      //NOTE: This is inefficient
      while(!foundNextEvent && (rawEventLine2 = liner2.next())) {
        rawEventLine2 = rawEventLine2.toString();
        let e2 = JSON.parse(rawEventLine2);

        let possibleEndAtMoment = moment(e2.content.occurredAt).unix();

        //AGENT_AVAILABILITY/UPDATED is updated when agent updates availability, logs out et al. - so we only look for this event
        if(possibleEndAtMoment >= availableStartAtForChannel && e2.content.agentId == thisAgentId && e2.id != e.id && e2.type == 'AGENT_AVAILABILITY/UPDATED') {
          availableEndAtForChannel = possibleEndAtMoment;
          foundNextEvent = true;
        }
      }

      //This is the start interval (round down to closest TIME_BUCKET_IN_MINUTES min)
      const startAtMinuteRemainder = moment(e.content.occurredAt).minute() % TIME_BUCKET_IN_MINUTES;
      const startAtSecond = moment(e.content.occurredAt).second();
      const startAtInterval = availableStartAtForChannel - startAtMinuteRemainder*60 - startAtSecond;

      //This is the end interval (round down to closest TIME_BUCKET_IN_MINUTES min)
      const endAtMinuteRemainder = TIME_BUCKET_IN_MINUTES - ( moment.unix(availableEndAtForChannel).minute() % TIME_BUCKET_IN_MINUTES);
      const endAtSecond = moment.unix(availableEndAtForChannel).second();
      const endAtInterval = (endAtMinuteRemainder === TIME_BUCKET_IN_MINUTES && endAtSecond === 0) ? availableEndAtForChannel : availableEndAtForChannel + endAtMinuteRemainder*60 - endAtSecond;

      const numIntervalsInBetween = (endAtInterval-startAtInterval) / (TIME_BUCKET_IN_MINUTES * 60);

      for(var i = 0; i < numIntervalsInBetween; i++) {
        let thisIntervalStartAt = startAtInterval + i*TIME_BUCKET_IN_MINUTES*60;
        let thisIntervalEndAt = thisIntervalStartAt + TIME_BUCKET_IN_MINUTES*60;
        let niceFormatIntervalStartAtIdentifier = moment.unix(thisIntervalStartAt).tz(TIMEZONE).format('YYYY-MM-DD HH:mm');

        let agentRawReportRowIdentifier = `${thisAgentId}-${niceFormatIntervalStartAtIdentifier}-${channel}`;

        if(typeof agentRawReport[agentRawReportRowIdentifier] === 'undefined') {
          agentRawReport[agentRawReportRowIdentifier] = {
            'Agent ID': thisAgentId,
            'Interval Start At': niceFormatIntervalStartAtIdentifier,
            'Timezone': TIMEZONE,
            'Interval Duration (minute)': TIME_BUCKET_IN_MINUTES,
            'Available Time (minutes)': 0,
            'Channel': channel
          }
        }

        //Agent was available for the entire interval
        if(thisIntervalStartAt >= availableStartAtForChannel && thisIntervalEndAt <= availableEndAtForChannel) {
          agentRawReport[agentRawReportRowIdentifier]['Available Time (minutes)'] += TIME_BUCKET_IN_MINUTES;
        }
        //Agent was available at the beginning of the interval, up until when they changed availability
        else if (thisIntervalStartAt >= availableStartAtForChannel && thisIntervalEndAt > availableEndAtForChannel) {
          agentRawReport[agentRawReportRowIdentifier]['Available Time (minutes)'] += (availableEndAtForChannel-thisIntervalStartAt)/60.0;
        }
        //Agent was available after the beginning of this interval, up until the end of the interval
        else if (thisIntervalStartAt < availableStartAtForChannel && thisIntervalEndAt <= availableEndAtForChannel) {
          agentRawReport[agentRawReportRowIdentifier]['Available Time (minutes)'] += (thisIntervalEndAt -availableStartAtForChannel)/60.0;
        }
        //Agent was available in between this interval
        else if (thisIntervalStartAt < availableStartAtForChannel && thisIntervalEndAt > availableEndAtForChannel) {
          agentRawReport[agentRawReportRowIdentifier]['Available Time (minutes)'] += (availableEndAtForChannel -availableStartAtForChannel)/60.0;
        }
      }
    }
  }

  let ret = [];
  for(i in agentRawReport) {
    ret.push(agentRawReport[i]);
  }

  return ret;
}

//This function will not correctly calculate hold time if the first CONTACT/HOLD_STARTED action the agent performs
//does not appear in the Events API response
//For example, if we pull the Events API from 00:00 - 00:30
//And the agent went on hold at 11:59 PM the day before
//We would never know the agent was on hold during the 00:00 - 00:30 interval
//To combat this, we always pull raw event from 00:00 (start of the day) up until ending interval
//This Events API will ALWAYS return by timestamp ASC, hence there is no need to write extra code to sort
function generateHoldEvents(rawEventsFile) {
  let agentRawReport = {};

  const liner = new lineByLine(rawEventsFile);
  let rawEventLine;

  while(rawEventLine = liner.next()) {
    rawEventLine = rawEventLine.toString();
    let e = JSON.parse(rawEventLine);
    let thisTimestamp = moment(e).unix();

    //We're looking at holds that were initiated by an agent
    if(e.type == 'CONTACT/HOLD_STARTED' && e.initiator && e.initiator.type == 'AGENT') {
      let thisAgentHoldStart = moment(e.timestamp).unix();
      let thisAgentHoldEnd = moment().unix();
      let thisAgentId = e.initiator.id;
      let thisContactId = e.contactId;

      //Find out when this agent went OFF hold
      let foundNextEvent = false;
      const liner2 = new lineByLine(rawEventsFile);
      let rawEventLine2;

      //NOTE: This is inefficient
      while(!foundNextEvent && (rawEventLine2 = liner2.next())) {
        rawEventLine2 = rawEventLine2.toString();
        let e2 = JSON.parse(rawEventLine2);

        //Find when this contact was taken off of hold - it means the agent is also off of hold
        if(e2.type == 'CONTACT/HOLD_ENDED' && e2.contactId == thisContactId && e2.id != e.id) {
          let possibleEndAtMoment = moment(e2.timestamp).unix();
          //This is the event we are looking for
          if(possibleEndAtMoment >= thisAgentHoldStart) {
            thisAgentHoldEnd = possibleEndAtMoment;
            foundNextEvent = true;
          }
        }
      }

      //This is the start interval (round down to closest TIME_BUCKET_IN_MINUTES min)
      const startAtMinuteRemainder = moment(e.timestamp).minute() % TIME_BUCKET_IN_MINUTES;
      const startAtSecond = moment(e.timestamp).second();
      const startAtInterval = thisAgentHoldStart - startAtMinuteRemainder*60 - startAtSecond;

      //This is the end interval (round down to closest TIME_BUCKET_IN_MINUTES min)
      const endAtMinuteRemainder = TIME_BUCKET_IN_MINUTES - ( moment.unix(thisAgentHoldEnd).minute() % TIME_BUCKET_IN_MINUTES);
      const endAtSecond = moment.unix(thisAgentHoldEnd).second();
      const endAtInterval = (endAtMinuteRemainder === TIME_BUCKET_IN_MINUTES && endAtSecond === 0) ? thisAgentHoldEnd : thisAgentHoldEnd + endAtMinuteRemainder*60 - endAtSecond;

      const numIntervalsInBetween = (endAtInterval-startAtInterval) / (TIME_BUCKET_IN_MINUTES * 60);

      for(var i = 0; i < numIntervalsInBetween; i++) {
        let thisIntervalStartAt = startAtInterval + i*TIME_BUCKET_IN_MINUTES*60;
        let thisIntervalEndAt = thisIntervalStartAt + TIME_BUCKET_IN_MINUTES*60;
        let niceFormatIntervalStartAtIdentifier = moment.unix(thisIntervalStartAt).tz(TIMEZONE).format('YYYY-MM-DD HH:mm');

        let agentRawReportRowIdentifier = `${thisAgentId}-${niceFormatIntervalStartAtIdentifier}`;

        if(typeof agentRawReport[agentRawReportRowIdentifier] === 'undefined') {
          agentRawReport[agentRawReportRowIdentifier] = {
            'Agent ID': thisAgentId,
            'Interval Start At': niceFormatIntervalStartAtIdentifier,
            'Timezone': TIMEZONE,
            'Interval Duration (minute)': TIME_BUCKET_IN_MINUTES,
            'Agent Initiated Hold Time (minutes)': 0
          }
        }

        //Agent was on hold for the entire interval
        if(thisIntervalStartAt >= thisAgentHoldStart && thisIntervalEndAt <= thisAgentHoldEnd) {
          agentRawReport[agentRawReportRowIdentifier]['Agent Initiated Hold Time (minutes)'] += TIME_BUCKET_IN_MINUTES;
        }
        //Agent was on hold at the beginning of the interval, up until when they changed availability
        else if (thisIntervalStartAt >= thisAgentHoldStart && thisIntervalEndAt > thisAgentHoldEnd) {
          agentRawReport[agentRawReportRowIdentifier]['Agent Initiated Hold Time (minutes)'] += (thisAgentHoldEnd-thisIntervalStartAt)/60.0;
        }
        //Agent was on hold after the beginning of this interval, up until the end of the interval
        else if (thisIntervalStartAt < thisAgentHoldStart && thisIntervalEndAt <= thisAgentHoldEnd) {
          agentRawReport[agentRawReportRowIdentifier]['Agent Initiated Hold Time (minutes)'] += (thisIntervalEndAt -thisAgentHoldStart)/60.0;
        }
        //Agent was on hold in between this interval
        else if (thisIntervalStartAt < thisAgentHoldStart && thisIntervalEndAt > thisAgentHoldEnd) {
          agentRawReport[agentRawReportRowIdentifier]['Agent Initiated Hold Time (minutes)'] += (thisAgentHoldEnd -thisAgentHoldStart)/60.0;
        }
      }
    }
  }

  let ret = [];
  for(i in agentRawReport) {
    ret.push(agentRawReport[i]);
  }

  return ret;
}
