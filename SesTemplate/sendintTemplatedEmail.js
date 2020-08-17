// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'REGION'});

var emailFrom = "no-reply@e-thela.com";

    //var emailTo = body.pk;

    var emailTo ="ethela.nepal@gmail.com"


// Create sendTemplatedEmail params 
var params = {
  Destination: { /* required */
    ToAddresses: [
      emailTo,
      /* more To email addresses */
    ]
  },
  Source: emailFrom, /* required */
  Template: 'USER_ORDER_ITEM_EMAIL', /* required */
  TemplateData: '{ \"REPLACEMENT_TAG_NAME\":\"REPLACEMENT_VALUE\" }', /* required */
};


// Create the promise and SES service object
var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendTemplatedEmail(params).promise();

// Handle promise's fulfilled/rejected states
sendPromise.then(
  function(data) {
    console.log(data);
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });