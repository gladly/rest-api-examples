# Background

This repository contains code examples, written in node.js, depicting common use cases for how to utilize Gladly REST API.

This repository should be used as a tool for **learning** and not as production code!

# Setup

## Step 1: Generate Gladly API token

Please follow [these](https://developer.gladly.com/rest/#section/Getting-Started/Creating-API-Tokens) instructions to create an API token.

## Step 2: Setup .env file

Now, you can set up your environment variables. To do so, copy the `.env-sample` file found in the root folder of this repository into a new file called `.env` (also to be created at the root folder of this repository).

Set the following:
- `GLADLY_HOST`: Set this to your Gladly URL (e.g.: https://sandbox.gladly.qa), making sure to not have an ending `/` at the end and including the `https://` protocol at the beginning
- `GLADLY_USERNAME`: Your Gladly developer email address (e.g.: gladlyadmin@gladly.com)
- `GLADLY_API_TOKEN`: The API token that you generated in Step 1
- `TMP_FILE_PATH`: If using conversation-export-to-csv, set this to `/tmp/` - this is where the results CSV file will be saved
- `FILE_TYPE`: If using conversation-export-to-csv, set this to one of agents, customers, conversation_items or topics (i.e.: file type from GET File API that will be transformed into CSV)
- `JOB_ID`: If using conversation-export-to-csv, set this to the Export Job ID you want to transform into a CSV file

Save the file

## Step 3: Install node modules

Make sure you are in the root directory of this repository on Terminal, then run this command:

`yarn install`

# Sample Scripts

## Create Customers

### What this script does

This script creates new customer profiles in Gladly utilizing a CSV file in `create-customers/sample-new-customers.csv`.

The script transforms each row in the CSV file to a customer profile object, then uses the [Gladly Create Customer API](https://developer.gladly.com/rest/#operation/createCustomer) to create the profile on Gladly.

When a profile is successfully created, the script will log the success using `console.log`

When a profile fails to be created, the script will log the error using `console.log`, along with the HTTP status code received.

The resultant profile looks something like this:

![](./tutorial-images/create-customers.png)

NOTE that the `customAttributes` may **not** display on your Gladly instance if you have not worked with a Gladly Support or Professional Services representative to configure them to display.

#### CSV to Gladly API data mapping logic

The script will loop through each row in the CSV file and import a customer profile using the following logic:
- `name`: this column is mapped to the Customer name on Gladly
- `address`: this column is mapped to the Customer address on Gladly
- `email:1`, `email:2`, `email:3`: these columns are added as email addresses to a single customer profile on Gladly. If the cell is blank, then the email will not be added to the profile. No email is imported as the `main` email. Note that emails are considered unique identifiers in Gladly, so if an email specified in one of these columns already exists in Gladly, the import for this row will fail.  
- `phone:1`, `phone:2`, `phone:3`: these columns are added as phone numbers to a single customer profile on Gladly. If the cell is blank, then the phone number will not be added to the profile. No phone number is currently set to the `main` phone number. Phone number is imported as type=OTHER (not MOBILE, which is considered a unique identifier in Gladly)

In addition, the script will auto-create an identifier for the customer profile using the [slugid](https://www.npmjs.com/package/slugid) node.js library.

A sample payload can be found below:
```
{"id":"XRJvp8lSS5aD2RucjY5zkw","name":"First1 Last1","address":"Address 1, CA, 12345","emails":[{"original":"person1@person.com"}],"phones":[{"original":"650 123 4567"},{"original":"650 123 4571"}],"customAttributes":{"attr1":"hello","attr3":"world"}}
```

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node create-customers`

### Sample console logs from script

```
SUCCESS - ROW 0: Created customer with ID XRJvp8lSS5aD2RucjY5zkw and payload {"id":"XRJvp8lSS5aD2RucjY5zkw","name":"First1 Last1","address":"Address 1, CA, 12345","emails":[{"original":"person1@person.com"}],"phones":[{"original":"650 123 4567"},{"original":"650 123 4571"}],"customAttributes":{"attr1":"hello","attr3":"world"}}
SUCCESS - ROW 3: Created customer with ID Wr3Cr5hGS9ucpnWnO_Uhxg and payload {"id":"Wr3Cr5hGS9ucpnWnO_Uhxg","name":"First4 Last4","address":"Address 4, CA, 12345","emails":[{"original":"person4@person.com"}],"phones":[{"original":"650 123 4570"}],"customAttributes":{"attr2":"world"}}
SUCCESS - ROW 1: Created customer with ID OPy0kbYIQp-mr3IcdQRWqw and payload {"id":"OPy0kbYIQp-mr3IcdQRWqw","name":"First2 Last2","address":"Address 2, CA, 12345","emails":[{"original":"person2@person.com"}],"phones":[{"original":"650 123 4568"}],"customAttributes":{"attr2":"world"}}
SUCCESS - ROW 2: Created customer with ID fWF-Q4lwTVepss3W2P2Cfw and payload {"id":"fWF-Q4lwTVepss3W2P2Cfw","name":"FIrst3 Last3","address":"Address 3, CA, 12345","emails":[{"original":"person3@person.com"},{"original":"person3+1@person.com"},{"original":"person3+2@person.com"}],"phones":[{"original":"650 123 4569"}],"customAttributes":{"attr3":"hi"}}
```

## Update Customers

We recommend utilizing this script after running the `create-customers` script.

### What this script does

This script updates customer profiles in Gladly utilizing a CSV file in `update-customers/sample-update-customers.csv`.

The script searches for the customer profile in Gladly using the `email` column and the [Gladly Find Customer API](https://developer.gladly.com/rest/#operation/findCustomers). Note that email is considered a unique identifier in Gladly, so if a matching profile is found, there will only be one potential result returned.

If a match is found, the script will then set the returned object's `name` value to the `name` in the CSV file and call the [Gladly Update Customer API](https://developer.gladly.com/rest/#operation/updateCustomer) to update the profile in Gladly.

When a profile is successfully updated, the script will log the success using `console.log`

When a profile fails to be update, the script will log the error using `console.log`, along with the HTTP status code received.

The resultant profile looks something like this:

![](./tutorial-images/update-customer.png)

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node update-customers`

### Sample console logs from script

```
SUCCESS - ROW 2: Found a match for customer with email person3@person.com. Attempting to update profile
SUCCESS - ROW 1: Found a match for customer with email person2@person.com. Attempting to update profile
SUCCESS - ROW 0: Found a match for customer with email person1@person.com. Attempting to update profile
SUCCESS - ROW 3: Found a match for customer with email person4@person.com. Attempting to update profile
SUCCESS - ROW 1: Updated customer profile with payload {"address":"Address 2, CA, 12345","customAttributes":{"attr2":"world"},"emails":[{"normalized":"person2@person.com","original":"person2@person.com"}],"name":"Person 2's New Name","phones":[{"normalized":"+16501234568","original":"650 123 4568","regionCode":"US","type":""}],"id":"OPy0kbYIQp-mr3IcdQRWqw","createdAt":"2021-09-28T21:10:10.373Z"}
SUCCESS - ROW 2: Updated customer profile with payload {"address":"Address 3, CA, 12345","customAttributes":{"attr3":"hi"},"emails":[{"normalized":"person3@person.com","original":"person3@person.com"},{"normalized":"person3+1@person.com","original":"person3+1@person.com"},{"normalized":"person3+2@person.com","original":"person3+2@person.com"}],"name":"Person 3's New Name","phones":[{"normalized":"+16501234569","original":"650 123 4569","regionCode":"US","type":""}],"id":"fWF-Q4lwTVepss3W2P2Cfw","createdAt":"2021-09-28T21:10:10.378Z"}
SUCCESS - ROW 3: Updated customer profile with payload {"address":"Address 4, CA, 12345","customAttributes":{"attr2":"world"},"emails":[{"normalized":"person4@person.com","original":"person4@person.com"}],"name":"Person 4's New Name","phones":[{"normalized":"+16501234570","original":"650 123 4570","regionCode":"US","type":""}],"id":"Wr3Cr5hGS9ucpnWnO_Uhxg","createdAt":"2021-09-28T21:10:10.370Z"}
SUCCESS - ROW 0: Updated customer profile with payload {"address":"Address 1, CA, 12345","customAttributes":{"attr1":"hello","attr3":"world"},"emails":[{"normalized":"person1@person.com","original":"person1@person.com"}],"name":"Person 1's New Name","phones":[{"normalized":"+16501234567","original":"650 123 4567","regionCode":"US","type":""},{"normalized":"+16501234571","original":"650 123 4571","regionCode":"US","type":""}],"id":"XRJvp8lSS5aD2RucjY5zkw","createdAt":"2021-09-28T21:10:10.262Z"}
```

## Create Tasks

We recommend utilizing this script after running the `create-customers` script.

### What this script does

This script creates tasks in Gladly utilizing a CSV file in `create-tasks/sample-new-tasks.csv`.

The script accomplishes this by doing the following:
- Lists all inboxes and agents using the [Gladly list inboxes API](https://developer.gladly.com/rest/#operation/getInboxes) and the [Gladly list agents API](https://developer.gladly.com/rest/#operation/getAgents)
- For each row in the CSV file, map the `inboxName` column to the appropriate Gladly inbox ID, and the `agentEmail` column to the appropriate Gladly agent ID (if this column is specified). An error is throw for this row if `inboxName` is not supplied / does not match an inbox name in Gladly, or if `agentEmail` is supplied, but does not match an agent email address in Gladly.
- Call the [Gladly create task API](https://developer.gladly.com/rest/#operation/createTaskAndCustomer) to create a new task with the due date set to the `dueAt` column, the task body set to the `task` column and the `customer.emailAddress` field set to the `email` column in the CSV

A sample task POST body can be found below:
```
{"id":"G2tzvtq1TPWcxqlf1h2vng","assignee":{"inboxId":"0tvvSDnvQVGchp-GaxCeGQ","agentId":null},"body":"please initiate a return","dueAt":"2024-09-28T00:00:00.000Z","customer":{"emailAddress":"person2@person.com"}}
```

When a task is successfully created, the script will log the success using `console.log`

When a task fails to be created, the script will log the error using `console.log`, along with the HTTP status code received.

The resultant task looks something like this:

![](./tutorial-images/create-task.png)

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node create-tasks`

### Sample console logs from script

```
ERROR - ROW 2: Inbox witih name  was specified in CSV file but could not be found in Gladly
ERROR - ROW 3: Inbox witih name  was specified in CSV file but could not be found in Gladly
ERROR - ROW 4: Inbox witih name inbox name was specified in CSV file but could not be found in Gladly


Starting API calls


SUCCESS - ROW 1: Created task with ID G2tzvtq1TPWcxqlf1h2vng and payload {"id":"G2tzvtq1TPWcxqlf1h2vng","assignee":{"inboxId":"0tvvSDnvQVGchp-GaxCeGQ","agentId":null},"body":"please initiate a return","dueAt":"2024-09-28T00:00:00.000Z","customer":{"emailAddress":"person2@person.com"}}
SUCCESS - ROW 0: Created task with ID ade2kDvwRnaA7ewXYtMyag and payload {"id":"ade2kDvwRnaA7ewXYtMyag","assignee":{"inboxId":"0tvvSDnvQVGchp-GaxCeGQ","agentId":"XeEJwrnuTfabHMK5ZW1fGg"},"body":"please create a return label","dueAt":"2023-09-28T00:00:00.000Z","customer":{"emailAddress":"person1@person.com"}}


Finished processing file
```

## Delete Customers

We recommend utilizing this script after running the `create-customers` script.

### What this script does

This script deletes customer profiles in Gladly utilizing a CSV file in `delete-customers/sample-customers-to-delete.csv`.

The script searches for the customer profile in Gladly using the `email` column and the [Gladly Find Customer API](https://developer.gladly.com/rest/#operation/findCustomers). Note that email is considered a unique identifier in Gladly, so if a matching profile is found, there will only be one potential result returned.

If a match is found, the script will then call the [Gladly Delete Customer API](https://developer.gladly.com/rest/#operation/deleteCustomer) to delete the profile in Gladly. Note that this operation is irreversible; deleted customer profiles cannot be restored. Profile deletion will fail if a customer has any open Conversations.

When a profile is successfully deleted, the script will log the success using `console.log`

When a profile fails to be deleted, the script will log the error using `console.log`, along with the HTTP status code received.

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node delete-customers`

### Sample console logs from script

```
SUCCESS - ROW 3: Found a match for customer with email person4@person.com. Attempting to delete profile
SUCCESS - ROW 1: Found a match for customer with email person2@person.com. Attempting to delete profile
SUCCESS - ROW 2: Found a match for customer with email person3@person.com. Attempting to delete profile
SUCCESS - ROW 0: Found a match for customer with email person1@person.com. Attempting to delete profile
SUCCESS - ROW 3: Deleted customer profile with id AgSEIR70Spu7g55D31txMg
SUCCESS - ROW 1: Deleted customer profile with id Vl9N5WwuSXqFsslGtF7Hww
SUCCESS - ROW 2: Deleted customer profile with id fsXEFNy1QGWhYhRRPJpjOQ
SUCCESS - ROW 0: Deleted customer profile with id AxfE0TZ_RF6NcxCaiog2mw
```

## Get Data Export

### What this script does

This script calls the [Gladly List Jobs API](https://developer.gladly.com/rest/#operation/findJobs), and then retrieves the job ID with the latest updatedAt date.

This script will then call the [Gladly Get File API](https://developer.gladly.com/rest/#operation/getFile) to download the associated job's `conversation_items.jsonl` file into a local file stored on `/tmp/conversation_items.jsonl`.

Upon download, the script will then go through each line in the `/tmp/conversation_items.jsonl` file and output a log.

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node get-data-export`

### Sample console logs from script
```
Got line from conversation_items.jsonl file: {"id":"9Xk3zKeuQMyQi2qjmDErDw","conversationId":"mTs0fj5qSo63Sg4RRuulPQ","content":{"content":"54321","messageType":"TEXT","sessionId":"5zjcbHOARMOmg8t11esqpA","type":"CHAT_MESSAGE"},"customerId":"594wMEbZSx-RmYSkUMeCPw","initiator":{"type":"CUSTOMER","id":"594wMEbZSx-RmYSkUMeCPw"},"timestamp":"2021-09-27T21:12:34.635Z"}
Got line from conversation_items.jsonl file: {"id":"UbUhScmvQCWR3qJgKr5fjg","conversationId":"mTs0fj5qSo63Sg4RRuulPQ","content":{"content":"First reply - clears SLA","messageType":"TEXT","sessionId":"5zjcbHOARMOmg8t11esqpA","type":"CHAT_MESSAGE"},"customerId":"594wMEbZSx-RmYSkUMeCPw","initiator":{"type":"AGENT","id":"XeEJwrnuTfabHMK5ZW1fGg"},"timestamp":"2021-09-27T21:12:50.277Z"}
Got line from conversation_items.jsonl file: {"id":"2DR0XwcbSVeo21lwx57D4g","conversationId":"mTs0fj5qSo63Sg4RRuulPQ","content":{"content":"2nd customer reply","messageType":"TEXT","sessionId":"5zjcbHOARMOmg8t11esqpA","type":"CHAT_MESSAGE"},"customerId":"594wMEbZSx-RmYSkUMeCPw","initiator":{"type":"CUSTOMER","id":"594wMEbZSx-RmYSkUMeCPw"},"timestamp":"2021-09-27T21:13:21.598Z"}
Got line from conversation_items.jsonl file: {"id":"xK9cnHU1QMWF95HKNdKNTg","conversationId":"UCeDRWE1Ro6vMYZ_MqPHsA","content":{"content":"Testing","messageType":"TEXT","sessionId":"4Ggwv__JSQGkvFxaQnzF_A","type":"CHAT_MESSAGE"},"customerId":"rvk8ApFfSL2iczWlNaISNQ","initiator":{"type":"CUSTOMER","id":"rvk8ApFfSL2iczWlNaISNQ"},"timestamp":"2021-09-27T21:15:57.618Z"}
```

## Get Reports

### What this script does

This script calls the [Gladly Work Sessions API](https://developer.gladly.com/rest/#tag/Reports/paths/~1api~1v1~1reports~1work-session-events/post) and logs the sum of the `work_session_handle_time` detected in that file.

This script then calls the [Gladly Generate Report API](https://developer.gladly.com/rest/#tag/Reports/paths/~1api~1v1~1reports/post) to retrieve the `ContactExportReport` ([documentation here](https://help.gladly.com/docs/contact-export?highlight=contact%20export)) and outputs the number of EMAIL contacts created on 09/28/21 Pacific Time.

Afterwards, the script calls the [Gladly Generate Report API](https://developer.gladly.com/rest/#tag/Reports/paths/~1api~1v1~1reports/post) to retrieve the `AgentTimestampsReport` ([documentation here](https://help.gladly.com/docs/agent-timestamps)) and outputs the number of `AGENT_STATUS/LOGGED_IN` events that occurred on 09/28/21 Pacific Time.

Note that the script calls reporting APIs 1 by 1, which helps keep us under the specific reporting API organization rate limit.

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node get-reports`

### Sample console logs from script

```
Detected 35.529 of work session handle time for contacts ended between 2021-09-28T00:00-07:00 and 2021-09-29T00:00-07:00. Used payload {"startAtTime":"2021-09-28T00:00-07:00","endAtTime":"2021-09-29T00:00-07:00"}
Detected 0 EMAIL contact(s) created on 09/28/21 America/Los_Angeles timezone. Used payload {"metricSet":"ContactExportReport","timezone":"America/Los_Angeles","startAt":"2021-09-28","endAt":"2021-09-28"}
Detected 1 agent logged in event(s) on 09/28/21 America/Los_Angeles timezone. Used payload {"metricSet":"AgentTimestampsReport","timezone":"America/Los_Angeles","startAt":"2021-09-28","endAt":"2021-09-28","filters":{}}
```

## Close Conversations

### What this script does

This script adds a topic to conversations in Gladly, and then closes them utilizing a CSV file in `close-conversations/sample-close-conversations.csv`.

The script accomplishes this by doing the following:
- Retrieves the conversation from Gladly using the [Get Conversation API](https://developer.gladly.com/rest/#operation/getConversation)
- Adds a topic to the conversation, as defined in the CSV file, using the [Add Topic API](https://developer.gladly.com/rest/#operation/addTopicToConversation)
- Closes the conversation, assigning it to the conversationId and agentId values the conversation is currently assigned to using the [Update Conversation API](https://developer.gladly.com/rest/#operation/patchConversation)

### How to use script

First, open up `close-conversations/sample-close-conversations.csv` and populate it with conversation + topic ID values from your very own Gladly instance.

Save your edits to this file.

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node close-conversations`

### Sample console logs from script

```
Starting API calls


SUCCESS - ROW 0: Closed conversation ID pzQgtVEsSsWho4qm1086WA


Finished processing file
```

## Close Tasks

### What this script does

This script closes Tasks utilizing a CSV file in `close-tasks/sample-close-tasks.csv`.

The script accomplishes this by doing the following:
- Retrieves the Task from Gladly using the [Get Task API](https://developer.gladly.com/rest/#operation/getTask)
- Closes the task, assigning it to the inboxId and agentId values the task is currently assigned to using the [Update Conversation API](https://developer.gladly.com/rest/#operation/patchTask)

### How to use script

First, open up `close-tasks/sample-close-tasks.csv` and populate it with task IDs you wish to close.

Save your edits to this file.

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node close-tasks`

### Sample console logs from script

```
Starting API calls


SUCCESS - ROW 0: Closed task ID pzQgtVEsSsWho4qm1086WA


Finished processing file
```

## Events WFM

### What this script does

This script uses the Events API to calculate Voice availability time, agent-initiated hold time and number of outbound phone calls on an agent-by-agent basis within 30 minute intervals. The script does this by calling the [Events API](https://developer.gladly.com/rest/#tag/Events/paths/~1api~1v1~1events/get) and retrieving events for `CONTACT` and `AGENT_AVAILABILITY`.

The script will output the duration of time (in minutes) that an Agent spent on hold & available for voice + the number of outbound phone calls an agent placed, sorted into 30 minute buckets.

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node events-wfm`

### Sample console logs from script

```
Voice: Hold Time
[
  {
    'Agent ID': 'agent---',
    'Interval Start At': '2021-11-09 05:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Agent Initiated Hold Time (minutes)': 6.033333333333333
  },
  {
    'Agent ID': 'agent2---',
    'Interval Start At': '2021-11-09 05:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Agent Initiated Hold Time (minutes)': 4.566666666666666
  }
]

Voice: Hold Time
[
  {
    'Agent ID': 'agent---',
    'Interval Start At': '2021-11-09 05:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Agent Initiated Hold Time (minutes)': 6.033333333333333
  },
  {
    'Agent ID': 'agent2---',
    'Interval Start At': '2021-11-09 05:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Agent Initiated Hold Time (minutes)': 4.566666666666666
  },
  {
    'Agent ID': 'agent3---',
    'Interval Start At': '2021-11-09 05:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Agent Initiated Hold Time (minutes)': 1.2999999999999998
  }
]

PHONE_CALL: Outbound Created
[
  {
    'Agent ID': 'agent---',
    'Interval Start At': '2021-11-09 06:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Contacts Created': 2,
    Channel: 'PHONE_CALL'
  },
  {
    'Agent ID': 'agent2---',
    'Interval Start At': '2021-11-09 06:00',
    Timezone: 'America/Los_Angeles',
    'Interval Duration (minute)': 30,
    'Contacts Created': 1,
    Channel: 'PHONE_CALL'
  }
]
```
## Redact Calls

### What this script does

This script calls the [Redact Conversation Item API](https://developer.gladly.com/rest/#operation/redactContent) and will redact all conversation items listed in the sample-redact-calls.csv

### How to use script
You can get a list of calls you want to redact by filtering by the voice channel and downloading the [contact export report](https://connect.gladly.com/docs/help-documentation/article/contact-export-v2/). Copy and paste the values from the Contact ID column into the sample-redact-calls.csv

Once the csv is complete, make sure you are in the root directory of this repository on Terminal, then run this command:

`node redact-calls`

### Sample console logs from script

```
Starting API calls


SUCCESS - ROW 0: redacted conversation abc123shQuGslmWmDXjifw
SUCCESS - ROW 1: redacted conversation efg456shQuGslmWmDXjifw
SUCCESS - ROW 2: redacted conversation hji789shQuGslmWmDXjifw
```

## Conversation Export to CSV

### What this script does

This script calls the [Gladly Get File API](https://developer.gladly.com/rest/#operation/getFile) and transforms the job ID and file type of your choice into a CSV file.

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node conversation-export-to-csv`

### Sample console logs from script

```
Saved file results in /tmp/lgShP1wsTNyrdH5YVi9BFg-agents.csv
```


## Add And Update Answers

### What this script does

This script adds / updates public Answers in Gladly by doing the following: 
- Loads a CSV called `answers.csv`
- Calls [List Audiences](https://developer.gladly.com/rest/#operation/getAudiences) API to get list of Audiences and their IDs
- For each row: 
  - Call [Add Answer API](https://developer.gladly.com/rest/#operation/addAnswer) to create an Answer container, using list of audiences above to map the row's list of audience names to their actual IDs in Gladly. If Audience name does not exist, ignore the error. 
  - If above API call fails due to a 409 error
    - Get the ID from the API response for the duplicate Answer
    - Call [Update Answer API](https://developer.gladly.com/rest/#operation/updateAnswer) to update the Answer container
    - Proceed with the rest
  - Call [Add or Update Answer Content API](https://developer.gladly.com/rest/#operation/addAnswerContentByLanguageAndType) to add / update Public Answer content

### How to use script
Set up the following Audiences in Gladly: 
- Audience 1
- Audience 2

Set up the following Languages in Gladly: 
- English - United States	
- French - Canada

`node add-and-update-answers`

### Sample console logs from script

```
Starting API calls


0,How to: Say Hello,,add,_sKRhTfySU2VGCHjmWU8vw
1,How to: Say Hello,,update,_sKRhTfySU2VGCHjmWU8vw
2,How to: Say Goodbye,,add,hUx7Cdt-RReT_RsnXG_-kQ
```

## Create Topics

### What this script does

This script creates new Topics in Gladly utilizing a CSV file in `create-topics/sample-new-topics.csv`.

The script transforms each row in the CSV file to a Topic object, pulling the necessary attributes, then uses the [Gladly Add Topic API](https://developer.gladly.com/rest/#operation/addTopic) to create the Topic on Gladly.

When a Topic is successfully created, the script will log the success using `console.log`

When a Topic fails to be created, the script will log the error using `console.log`, along with the HTTP status code received.

#### CSV to Gladly API data mapping logic

The script will loop through each row in the CSV file and import a Topic using the following logic:
- `id`: this column is mapped to the Topic's id in Gladly (optional)
- `name`: this column is mapped to the Topic name on Gladly (required)
- `disabled`: this column is mapped to whether the Topic is active or archived on Gladly. (optional -- defaults to `false`/active on Gladly)
- `parentId`: this column is mapped to the id of a parent Topic, if creating a nested topic (optional)

A sample payload can be found below:
```
{"id":"id4","name":"Wrong Size","disabled":false,"parentId":"id2"}
```

### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node create-topics`

### Sample console logs from script

```
SUCCESS - ROW 0: Created Topic with ID id1 and payload {"id":"id1","name":"Returns"}
SUCCESS - ROW 3: Created Topic with ID id4 and payload {"id":"id4","name":"Wrong Size","parentId":"id1"}
SUCCESS - ROW 1: Created Topic with ID id2 and payload {"id":"id2","name":"Exchanges"}
SUCCESS - ROW 2: Created Topic with ID id3 and payload {"id":"id3","name":"Loyalty Program (ARCHIVED)","disabled":true}
```

## Update Customers

We recommend utilizing this script after running the `create-topics` script.

### What this script does

This script updates an organization's Topics in Gladly utilizing a CSV file in `update-topics/sample-update-topics.csv`.

Topics are updated by making a call to the corresponding Topic id, using the [Gladly Update Topic API](https://developer.gladly.com/rest/#operation/updateTopic).

When a Topic is successfully updated, the script will log the success using `console.log`

When a Topic fails to be update, the script will log the error using `console.log`, along with the HTTP status code received.


### How to use script

Make sure you are in the root directory of this repository on Terminal, then run this command:

`node update-topics`

### Sample console logs from script

```
SUCCESS - ROW 0: Updated Topic with ID id3 and payload {"id":"id3","name":"Loyalty Program","disabled":false}
SUCCESS - ROW 1: Updated Topic with ID id4 and payload {"id":"id4","name":"Wrong Size","parentId":"id2"}
```