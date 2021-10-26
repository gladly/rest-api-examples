const { gladlyApiRequest, gladlyFileDownload } = require('./api-request');

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

//https://developer.gladly.com/rest/#operation/createTaskAndCustomer
module.exports.createTask = function(taskObject) {
  return gladlyApiRequest('POST', `/api/v1/tasks`, taskObject);
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

module.exports.generateReport = function(payload) {
  return gladlyApiRequest('POST', '/api/v1/reports', payload);
}

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

//https://developer.gladly.com/rest/#operation/patchConversation
module.exports.getConversation = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversations/${id}`);
}
