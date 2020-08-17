'use strict';
const AWS= require('aws-sdk');
var ses = new AWS.SES();
AWS.config.update({region:"us-east-2"});
var Handlebars = require('handlebars');
var fs = require('fs');
//https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ses-examples-creating-template.html
  

exports.create =  (event, context) => {
  
      fs.readFile("./userTemplate.html", function (err, emailHtmlTemplate) {
       if (err) {
           console.log("Unable to load HTML Template");
           throw err;
       }
       console.log("Template is")
       console.log(emailHtmlTemplate);
       var templateHtml = Handlebars.compile(emailHtmlTemplate.toString());
       var htmlPart=templateHtml();
      var params = {
        Template: { 
          TemplateName: 'USER_ORDER_ITEM_EMAIL', /* required */
          HtmlPart: htmlPart,
          SubjectPart: 'Thank you for placing your order with us',
          TextPart: 'Your order for has been placed'
        }
      };
      // Create the promise and SES service object
      var templatePromise = new AWS.SES({apiVersion: '2010-12-01'}).updateTemplate(params).promise();
      
      // Handle promise's fulfilled/rejected states
      templatePromise.then(
        function(data) {
          console.log("created")
          console.log(data);
        }).catch(
          function(err) {
            console.log("False")
          console.error(err, err.stack);
        });
      });
       //HtmlPart: '<h1>AWS Amazon Simple Email Service Test Email</h1><p>This email was sent with <a href=\"https://aws.amazon.com/ses/\">Amazon SES</a> using the <a href=\"https://aws.amazon.com/sdk-for-php/\">AWS SDK for PHP</a>.</p>',
      // console.log(templateHtml);
      
   }

