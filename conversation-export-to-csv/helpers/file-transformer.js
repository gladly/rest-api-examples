require('dotenv').config();

const _ = require('lodash');
const { getFile } = require('../../util/api');
const fs = require('fs');
const lineReader = require('line-reader');
const { parse } = require('json2csv');

const TMP_RAW_FILE_PATH = `${process.env.TMP_FILE_PATH}/${process.env.JOB_ID}-${process.env.FILE_TYPE}.jsonl`;
const TMP_RESULTS_FILE_PATH = `${process.env.TMP_FILE_PATH}/${process.env.JOB_ID}-${process.env.FILE_TYPE}.csv`;

module.exports.conversationItems = function() {
    return new Promise((resolve, reject) => {
        const FILE_ROW_HEADERS = [
            'id',
            'customer_id',
            'conversation_id',
            'timestamp',
            'initiator_id',
            'initiator_type',
            'responder_id',
            'responder_type',
            'content_type',
            'chat_message_type',
            'chat_session_id',
            'chat_content',
            'conversation_status_changed_to',
            'customer_activity_title',
            'customer_activity_body',
            'customer_activity_type',
            'customer_activity_source_name',
            'customer_activity_link_url',
            'customer_activity_link_text',
            'customer_activity_occurred_at',
            'customer_activity_received_at',
            'email_from',
            'email_to',
            'email_cc',
            'email_bcc',
            'email_subject',
            'email_content',
            'facebook_pageid',
            'facebook_userid',
            'facebook_content',
            'note_body',
            'phone_from',
            'phone_to',
            'phone_started_at',
            'phone_answered_at',
            'phone_completed_at',
            'phone_recording_status',
            'phone_recording_url',
            'phone_recording_duration',
            'sms_from',
            'sms_to',
            'sms_content',
            'added_topic_ids',
            'removed_topic_ids',
            'voicemail_started_at',
            'voicemail_recording_status',
            'voicemail_recording_url',
            'voicemail_recording_duration'
        ];

        /* Overwrite local file with header on first header row */
        fs.writeFileSync(TMP_RESULTS_FILE_PATH, `"${FILE_ROW_HEADERS.join('","')}"\n`);

        getFile(process.env.JOB_ID, `${process.env.FILE_TYPE}.jsonl`, TMP_RAW_FILE_PATH)
        .then(() => {
            lineReader.eachLine(TMP_RAW_FILE_PATH, (line, last, cb) => {
                let conversationItem = JSON.parse(line);

                if(!conversationItem.content) {
                    return reject('Incorrectly formatted file');
                }

                let csvFileLine = {
                    0: conversationItem.id,
                    1: conversationItem.customerId,
                    2: conversationItem.conversationId || '',
                    3: conversationItem.timestamp,
                    4: conversationItem.initiator ? conversationItem.initiator.id : '',
                    5: conversationItem.initiator ? conversationItem.initiator.type : '',
                    6: conversationItem.responder ? conversationItem.responder.id : '',
                    7: conversationItem.responder ? conversationItem.responder.type : '',
                    8: conversationItem.content.type,
                    9: conversationItem.content.type == 'CHAT_MESSAGE' ? conversationItem.content.messageType : '',
                    10: conversationItem.content.type == 'CHAT_MESSAGE' ? conversationItem.content.sessionId : '',
                    11: conversationItem.content.type == 'CHAT_MESSAGE' ? conversationItem.content.content : '',
                    12: conversationItem.content.type == 'CONVERSATION_STATUS_CHANGE' ? conversationItem.content.status : '',
                    13: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.title : '',
                    14: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.body : '',
                    15: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.activityType : '',
                    16: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.sourceName : '',
                    17: conversationItem.content.type == 'CUSTOMER_ACTIVITY' && conversationItem.content.link ? conversationItem.content.link.url : '',
                    18: conversationItem.content.type == 'CUSTOMER_ACTIVITY' && conversationItem.content.link ? conversationItem.content.link.text : '',
                    19: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.occurredAt : '',
                    20: conversationItem.content.type == 'CUSTOMER_ACTIVITY' ? conversationItem.content.receivedAt : '',
                    21: conversationItem.content.type == 'EMAIL' ? conversationItem.content.from : '',
                    22: conversationItem.content.type == 'EMAIL' && conversationItem.content.to ? conversationItem.content.to.join(',') : '',
                    23: conversationItem.content.type == 'EMAIL' && conversationItem.content.cc ? conversationItem.content.cc.join(',') : '',
                    24: conversationItem.content.type == 'EMAIL' && conversationItem.content.bcc ? conversationItem.content.bcc.join(',') : '',
                    25: conversationItem.content.type == 'EMAIL' ? conversationItem.content.subject : '',
                    26: conversationItem.content.type == 'EMAIL' ? conversationItem.content.content : '',
                    27: conversationItem.content.type == 'FACEBOOK_MESSAGE' ? conversationItem.content.pageId : '',
                    28: conversationItem.content.type == 'FACEBOOK_MESSAGE' ? conversationItem.content.userId : '',
                    29: conversationItem.content.type == 'FACEBOOK_MESSAGE' ? conversationItem.content.content : '',
                    30: conversationItem.content.type == 'CONVERSATION_NOTE' ? conversationItem.content.body : '',
                    31: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.from : '',
                    32: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.to : '',
                    33: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.startedAt : '',
                    34: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.answeredAt : '',
                    35: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.completedAt : '',
                    36: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.recordingStatus : '',
                    37: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.recordingUrl : '',
                    38: conversationItem.content.type == 'PHONE_CALL' ? conversationItem.content.recordingDuration : '',
                    39: conversationItem.content.type == 'SMS' ? conversationItem.content.from : '',
                    40: conversationItem.content.type == 'SMS' ? conversationItem.content.to : '',
                    41: conversationItem.content.type == 'SMS' ? conversationItem.content.content : '',
                    42: conversationItem.content.type == 'TOPIC_CHANGE' && conversationItem.content.addedTopicIds ? conversationItem.content.addedTopicIds.join(',') : '',
                    43: conversationItem.content.type == 'TOPIC_CHANGE' && conversationItem.content.removedTopicIds ? conversationItem.content.removedTopicIds.join(',') : '',
                    44: conversationItem.content.type == 'VOICEMAIL' ? conversationItem.content.startedAt : '',
                    45: conversationItem.content.type == 'VOICEMAIL' ? conversationItem.content.recordingStatus : '',
                    46: conversationItem.content.type == 'VOICEMAIL' ? conversationItem.content.recordingUrl : '',
                    47: conversationItem.content.type == 'VOICEMAIL' ? conversationItem.content.recordingDuration : '',
                    48: conversationItem.content.type == 'INSTAGRAM_DIRECT' ? conversationItem.content.content : '',
                    49: conversationItem.content.type == 'WHATSAPP' ? conversationItem.content.content : ''
                };

                let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);

                if(last) {
                    resolve(TMP_RESULTS_FILE_PATH);
                } else {
                    cb();
                }
            });
        }).catch((e) => {
            reject(e);
        })
    });
}

module.exports.customers = function() {
    return new Promise((resolve, reject) => {
        const FILE_ROW_HEADERS = [
            'id',
            'name', 
            'address', 
            'externalCustomerId',
            'externalCustomerIds',
            'contact_type',
            'contact_address'
        ];

        /* Overwrite local file with header on first header row */
        fs.writeFileSync(TMP_RESULTS_FILE_PATH, `"${FILE_ROW_HEADERS.join('","')}"\n`);

        getFile(process.env.JOB_ID, `${process.env.FILE_TYPE}.jsonl`, TMP_RAW_FILE_PATH)
        .then(() => {
            lineReader.eachLine(TMP_RAW_FILE_PATH, (line, last, cb) => {
                let customer = JSON.parse(line);

                if(customer.emailAddresses) {
                    _.each(customer.emailAddresses, (address) => {
                        let csvFileLine = {
                            0: customer.id,
                            1: customer.name,
                            2: customer.address, 
                            3: customer.externalCustomerId, 
                            4: customer.externalCustomerIds ? JSON.stringify(customer.externalCustomerIds) : '',
                            5: 'email',
                            6: address
                        };

                        let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                        fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);
                    });
                }

                if(customer.phoneNumbers) {
                    _.each(customer.phoneNumbers, (address) => {
                        let csvFileLine = {
                            0: customer.id,
                            1: customer.name,
                            2: customer.address, 
                            3: customer.externalCustomerId, 
                            4: customer.externalCustomerIds ? JSON.stringify(customer.externalCustomerIds) : '',
                            5: 'phone',
                            6: address
                        };

                        let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                        fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);
                    });
                }

                if(!customer.emailAddresses && !customer.phoneNumbers) {
                    let csvFileLine = {
                        0: customer.id,
                        1: customer.name,
                        2: customer.address, 
                        3: customer.externalCustomerId, 
                        4: customer.externalCustomerIds ? JSON.stringify(customer.externalCustomerIds) : '',
                        5: '',
                        6: ''
                    };

                    let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                    fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);
                }

                if(last) {
                    resolve(TMP_RESULTS_FILE_PATH);
                } else {
                    cb();
                }
            });
        }).catch((e) => {
            reject(e);
        })
    });
}

module.exports.topics = function() {
    return new Promise((resolve, reject) => {
        const FILE_ROW_HEADERS = [
            'id', 
            'name', 
            'disabled',
            'parentId'
        ];

        /* Overwrite local file with header on first header row */
        fs.writeFileSync(TMP_RESULTS_FILE_PATH, `"${FILE_ROW_HEADERS.join('","')}"\n`);

        getFile(process.env.JOB_ID, `${process.env.FILE_TYPE}.jsonl`, TMP_RAW_FILE_PATH)
        .then(() => {
            lineReader.eachLine(TMP_RAW_FILE_PATH, (line, last, cb) => {
                let topic = JSON.parse(line);

                let csvFileLine = {
                    0: topic.id,
                    1: topic.name, 
                    2: topic.disabled, 
                    3: topic.parentId
                };

                let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);

                if(last) {
                    resolve(TMP_RESULTS_FILE_PATH);
                } else {
                    cb();
                }
            });
        }).catch((e) => {
            reject(e);
        })
    });
}

module.exports.agents = function() {
    return new Promise((resolve, reject) => {
        const FILE_ROW_HEADERS = [
            'id', 
            'name', 
            'emailAddress'
        ];

        /* Overwrite local file with header on first header row */
        fs.writeFileSync(TMP_RESULTS_FILE_PATH, `"${FILE_ROW_HEADERS.join('","')}"\n`);

        getFile(process.env.JOB_ID, `${process.env.FILE_TYPE}.jsonl`, TMP_RAW_FILE_PATH)
        .then(() => {
            lineReader.eachLine(TMP_RAW_FILE_PATH, (line, last, cb) => {
                let agent = JSON.parse(line);

                let csvFileLine = {
                    0: agent.id,
                    1: agent.name, 
                    2: agent.emailAddress
                };

                let csv = parse(csvFileLine, {header: false, fields: _.keys(csvFileLine)});

                fs.appendFileSync(TMP_RESULTS_FILE_PATH, `${csv}\n`);

                if(last) {
                    resolve(TMP_RESULTS_FILE_PATH);
                } else {
                    cb();
                }
            });
        }).catch((e) => {
            reject(e);
        })
    });
}