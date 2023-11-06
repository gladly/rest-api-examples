const { conversationItems, customers, topics, agents } = require('./helpers/file-transformer.js');

let promises = [];

if(process.env.FILE_TYPE === 'conversation_items') {
    promises.push(conversationItems());
} else if(process.env.FILE_TYPE === 'customers') {
    promises.push(customers());
} else if(process.env.FILE_TYPE === 'topics') {
    promises.push(topics());
} else if(process.env.FILE_TYPE === 'agents') {
    promises.push(agents());
}

Promise.all(promises)
.then((fileLocation) => {
    console.log(`Saved file results in ${fileLocation}`);
}).catch((e) => {
    console.log(e);
})