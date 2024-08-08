const { gladlyApiRequest, gladlyFileDownload, gladlyApiRequestSaveToFile } = require('./api-request');

//https://developer.gladly.com/rest/#operation/createCustomer
module.exports.getCustomerById = function(id) {
  return gladlyApiRequest('GET', `/api/v1/customer-profiles/${id}`);
}

//https://developer.gladly.com/rest/#operation/findCustomers
module.exports.findCustomer = function(searchQuery, searchFilter) {
  return gladlyApiRequest('GET', `/api/v1/customer-profiles?${encodeURIComponent(searchFilter)}=${encodeURIComponent(searchQuery)}`);
}

//https://developer.gladly.com/rest/#operation/createCustomer
module.exports.createCustomer = function(customerObject) {
  return gladlyApiRequest('POST', '/api/v1/customer-profiles', customerObject);
}

//https://developer.gladly.com/rest/#operation/updateCustomer
module.exports.updateCustomer = function(customerObject) {
  return gladlyApiRequest('PATCH', `/api/v1/customer-profiles/${customerObject.id}`, customerObject);
}

//https://developer.gladly.com/rest/#operation/deleteCustomer
module.exports.deleteCustomer = function (customerId) {
  return gladlyApiRequest('DELETE', `/api/v1/customer-profiles/${customerId}`);
};

//https://developer.gladly.com/rest/#operation/redactContent
module.exports.redactConversationItem = function(id) {
  return gladlyApiRequest('POST', `/api/v1/conversation-items/${id}/redact`);
}

//https://developer.gladly.com/rest/#operation/getConversationItems
module.exports.getConversationItems = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversations/${id}/items`);
}

//https://developer.gladly.com/rest/#operation/createTaskAndCustomer
module.exports.createTask = function(taskObject) {
  return gladlyApiRequest('POST', `/api/v1/tasks`, taskObject);
}

//https://developer.gladly.com/rest/#operation/createTask
module.exports.createTaskForCustomer = function(customerId, taskObject) {
  return gladlyApiRequest('POST', `/api/v1/customers/${customerId}/tasks`, taskObject);
}

//https://developer.gladly.com/rest/#operation/getInboxes
module.exports.listInboxes = function() {
  return gladlyApiRequest('GET', `/api/v1/inboxes`);
}

//https://developer.gladly.com/rest/#operation/getAgents
module.exports.listAgents = function() {
  return gladlyApiRequest('GET', `/api/v1/agents`);
}

//https://developer.gladly.com/rest/#operation/findJobs
module.exports.listJobs = function(status) {
  const filter = status ? `?status=${encodeURIComponent(status)}` : '';

  return gladlyApiRequest('GET', `/api/v1/export/jobs${filter}`);
}

//https://developer.gladly.com/rest/#operation/getFile
module.exports.getFile = function(id, file, localPath) {
  return gladlyFileDownload('GET', `/api/v1/export/jobs/${id}/files/${file}`, localPath);
}

//https://developer.gladly.com/rest/#tag/Reports/paths/~1api~1v1~1reports/post
module.exports.generateReport = function(payload) {
  return gladlyApiRequest('POST', '/api/v1/reports', payload);
}

//https://developer.gladly.com/rest/#tag/Reports/paths/~1api~1v1~1reports~1work-session-events/post
module.exports.generateWorkSessionReport = function(payload) {
  return gladlyApiRequest('POST', '/api/v1/reports/work-session-events', payload);
}

//https://developer.gladly.com/rest/#operation/addTopicToConversation
module.exports.addTopics = function(conversationId, payload) {
  return gladlyApiRequest('POST', `/api/v1/conversations/${conversationId}/topics`, payload);
}

//https://developer.gladly.com/rest/#operation/patchConversation
module.exports.updateConversation = function(id, conversationObject) {
  return gladlyApiRequest('PATCH', `/api/v1/conversations/${id}`, conversationObject);
}

//https://developer.gladly.com/rest/#operation/getConversation
module.exports.getConversation = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversations/${id}`);
}

module.exports.getAgentEvents = function(startAtTime, endAtTime, entities, saveToFileName) {
  entities = `&entities=${entities.join('&entities=')}`;
  return gladlyApiRequestSaveToFile('GET', `/api/v1/events?startAt=${startAtTime}&endAt=${endAtTime}${entities}`, null, saveToFileName);
}

//https://developer.gladly.com/rest/#operation/addAnswer
module.exports.addAnswer = function(payload) {
  return gladlyApiRequest('POST', `/api/v1/answers`, payload);
}

//https://developer.gladly.com/rest/#operation/getAnswer
module.exports.getAnswer = function(answerId) {
  return gladlyApiRequest('GET', `/api/v1/answers/${answerId}`);
}

//https://developer.gladly.com/rest/#operation/getAnswerContentByLanguageAndType
module.exports.getAnswerContentByLanguageAndType = function(answerId, language, type) {
  return gladlyApiRequest('GET', `/api/v1/answers/${answerId}/languages/${language}/type/${type}`);
}

//https://developer.gladly.com/rest/#operation/updateAnswer
module.exports.updateAnswer = function(answerId, payload) {
  return gladlyApiRequest('PATCH', `/api/v1/answers/${answerId}`, payload);
}

//https://developer.gladly.com/rest/#operation/addAnswerContentByLanguageAndType
module.exports.addOrUpdateAnswerContent = function(answerId, language, type, payload) {
  return gladlyApiRequest('PUT', `/api/v1/answers/${answerId}/languages/${language}/type/${type}`, payload);
}

//https://developer.gladly.com/rest/#operation/deleteAnswer
module.exports.deleteAnswer = function(answerId) {
  return gladlyApiRequest('DELETE', `/api/v1/answers/${answerId}`);
}

//https://developer.gladly.com/rest/#operation/deleteAnswerContentByLanguageAndType
module.exports.deleteAnswerContent = function(answerId, language, type) {
  return gladlyApiRequest('DELETE', `/api/v1/answers/${answerId}`);
}

//https://developer.gladly.com/rest/#operation/getAudiences
module.exports.listAudiences = function() {
  return gladlyApiRequest('GET', `/api/v1/audiences`);
}