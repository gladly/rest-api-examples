const axios = require('axios');
const fs = require('fs');

module.exports.gladlyFileDownload = function(method, apiPath, localPath) {
  let file = fs.createWriteStream(localPath);

  return new Promise((resolve, reject) => {
    axios({
      url: `${process.env.GLADLY_HOST}${apiPath}`,
      headers: {
        'Authorization': `Basic ${generateBasicAuthToken()}`
      },
      method: method,
      responseType: 'stream'
    }).then((res) => {
      //save response to a file
      res.data.pipe(file);

      file.on('error', (err) => {
        fs.unlink(localPath);
        reject(err);
      });

      file.on('finish', () => {
        file.close();
        resolve(localPath);
      });
    }).catch((err) => {
      console.log(err);
      reject(err);
    });
  });
}

module.exports.gladlyApiRequest = function(method, apiPath, requestBody) {
  let requestObj = {
    method: method,
    url: `${process.env.GLADLY_HOST}${apiPath}`,
    timeout: 300 * 1000, //5 minute timeout should be more than sufficient for reports
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Basic ${generateBasicAuthToken()}`
    }
  };

  //Add in POST / PATCH body
  if(requestBody && method != 'GET') {
    requestObj.data = requestBody;
  }

  return axios(requestObj);
}

function generateBasicAuthToken() {
  return Buffer.from(`${process.env.GLADLY_USERNAME}:${process.env.GLADLY_API_TOKEN}`).toString('base64');
}
