'use strict';
const helper = require('./helper.js');
const AWS= require('aws-sdk');
const sendEmail = require('./sendEmail.js')
AWS.config.update({region:"us-east-2"});

var ses = new AWS.SES({region: 'us-east-2'});
const sendEmailAdmin =  async (body, items,emailData) => {

    console.log("notifying Admin...");
    var ccEmail="ethela.nepal@gmail.com";
    var toEmail=['ethela.nepal@gmail.com'];
    var fromEmail='no-reply@e-thela.com';
    var emailSubject = "New Order Placed Order Id " + body.sk; 
    sendRawEmail(fromEmail,toEmail,ccEmail,emailSubject,items,"USER_ORDER_ITEM_EMAIL",emailData);
}

const sendEmailUser =  async (body, items,emailData) => {

    console.log("notifying User...");
    var emailFrom = "no-reply@e-thela.com";
    var ccEmail="ethela.nepal@gmail.com";

    var emailTo =[body.address.email,"ethela.nepal@gmail.com"]

    var emailSubject = "Thank You for your Order, Your Order Number is: " + body.sk;

    sendRawEmail(emailFrom,emailTo,ccEmail,emailSubject,items,"USER_ORDER_ITEM_EMAIL",emailData);


}

var sendRawEmail = async (emailFrom, emailTo,ccEmail, emailSubject,body,template,templateData)=>{
    
        console.log(templateData);
    // Create sendTemplatedEmail params 
        var params = {
          Destination: {
            ToAddresses: emailTo
          },
          Source: emailFrom, 
          Template: template, 
          TemplateData: templateData,
        };
        

    
     ses.sendTemplatedEmail(params, function (err, data) {
        if (err) {
            console.log("Failed to end")
            console.log(err);
            context.fail(err);
        } else {
            console.log("Email sent")
            console.log(data);
            context.succeed(event);
        }
    });
    
}


exports.sendEmail =  async (body) => {
    const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion : "2012-10-08" })
    console.log("Incoming body")
    console.log(body);
    var orderId =  body.sk;
    var orderItems = await helper.getItemsById(orderId,documentClient);
    
    if(orderItems!==null){
     var emailData = helper.formatData(body,orderItems);
     sendEmail.sendUseremail(emailData)
     sendEmail.sendEmailAdmin(emailData)
       
    }
}

