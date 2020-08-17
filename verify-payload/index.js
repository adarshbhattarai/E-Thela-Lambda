'use strict';


const AWS= require('aws-sdk');
const axios = require('axios');
const ses = require('./ses.js');

AWS.config.update({region:"us-east-2"});
//This one function verifies both the cash payment and 
//Khalti payment.
//For Cash Payment we will receive t as "cash" on payload
//For Khalti Payment we will receive t as "txn" on payload

//For verification  
//1. Check the type of payment(Khalti / Cash)-->Done
//2. If it is cash: get the orderId(product_identity) and useremail(product_name) ID and update the record, set status in DDB as "PLACED", On PAYMENT, set DUE
//3. If it is khalti Payment: Verify the payment with khalti merchant
            //i) If success, update DDB as PLACED and on PAYMENT, SET PAID
            //ii) If error, return error, show cannot be placed.
//4. For Successful orders send email notifications.

const updateUserOrder = async  (ddbObject, documentClient) =>{

    console.log("Updating User Order... ")
    console.log(ddbObject)
    const table =  "UserOrder";
    const pk = ddbObject.pk;
    const sk = ddbObject.sk;

    const payment = ddbObject.payment;
    const status = ddbObject.status;
    const paymentOption = ddbObject.paymentOption;
    const paidAmount = ddbObject.paidAmount;
    const khaltiResponse = ddbObject.khaltiResponse ;

    const updateExpression = 
        'set payment = :payment, #st = :status, paymentOption = :paymentOption,paidAmount = :paidAmount '+(khaltiResponse? ' , khaltiResponse = if_not_exists(khaltiResponse, :khaltiResponse) ' :'') ;

    var params = {
        TableName: table,
        Key: {
          'pk' : pk,
          'sk' : sk
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: { ':payment': payment, ':status': status  , ':paymentOption' : paymentOption, ':paidAmount' : paidAmount , ':khaltiResponse' : khaltiResponse},
        ExpressionAttributeNames :{
         "#st": "status"
         }
      };

      console.log("Updating the item... ==> pk " + pk + " sk " + sk);
      documentClient.update(params, function(err, data) {
          if (err) {
              console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          }
      });

}

const findRecordfromDDB = async (body, documentClient)=>{

    console.log("findRecordfromDDB")
    const pk = body.product_name;
    const sk = body.product_identity;

    console.log(body, pk , sk);
    const param = {
        TableName :"UserOrder",
        Key: {
            pk:"USER#"+pk,
            sk : "ORDER#"+sk
        }
    }
    try{
        const data = await documentClient.get(param).promise();
        console.log(data);
        return data;
    }catch (err) {
        console.log(err);
    }
    return null;
}

const notify = function(body){
    ses.sendEmail(body)
}

const merchantVerification = async (body)=>{
    let data = {
        "token": body.token,
        "amount": body.amount
    };
    let key ='Key ' + process.env.SECRET_KEY
    let config = {
        headers: {'Authorization': key}
    };
    
    return axios.post("https://khalti.com/api/v2/payment/verify/", data, config);
}

const Validate = function(request, ddbObj){

    return request.amount === ddbObj.total;
}

const khaltiPaymentHandler = async (body,ddbObj, documentClient)=>{
   
    try{
        const response = await merchantVerification(body);
        console.log("Verification successful")
        console.log(response.data);
        ddbObj.payment = "PAID";
        ddbObj.status = "PLACED";
        ddbObj.paymentOption = "KHALTI";
        ddbObj.paidAmount = response.data.amount;
        ddbObj['khaltiResponse'] = response.data; 
        updateUserOrder(ddbObj,documentClient);
        notify(ddbObj);
    } catch(err){
        console.log("error during merchant verification")
        console.log(err);
        ddbObj.payment = "FAILED";
        ddbObj.paymentOption = "KHALTI";
        updateUserOrder(ddbObj,documentClient);
    }

}

const cashPaymentHandler = async (body,ddbObj, documentClient)=>{

    ddbObj.payment = "DUE";
    ddbObj.status = "PLACED";
    ddbObj.paymentOption = "CASH";
    updateUserOrder(ddbObj,documentClient);
    notify(ddbObj);
}

function err(callback){
    console.error("Somethings Quite not right " )

    return callback(null, {
        isBase64Encoded: false,
        statusCode: 400,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify({"Error Message:": "Something's quite not right"})
      });
}

exports.handler = async (event, context, callback) => {
    const request = (event && event.body) ? JSON.parse(event.body) : null;
    if(!request || (request.t !== 'cash' && request.t != 'txn')){
        return err(callback);
    }
   
   console.log(event)
   console.log("Verification Started")
    //Unmarshall types in the returned documents.
    const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion : "2012-10-08" })

    console.log("Calling findRecordfromDDB")
    const record = await findRecordfromDDB(request,documentClient);
    if(record == null ){
        return err(callback);
    }
    console.log("response")
    console.log(record)
    const ddbObj = record.Item;
    console.log("Validating amount...")
    if(!Validate(request,ddbObj)){//Amount Validation
        //return err(callback);
    }

    console.log("Database Obj")
    console.log(ddbObj);

    if(request.t==='cash'){
        console.log("Cash Handler")
        cashPaymentHandler(request, ddbObj, documentClient);
    }
    else if(request.t === 'txn'){
        console.log("Khalti Handler")
        khaltiPaymentHandler(request,ddbObj, documentClient);
    }
    //Early exit
     const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: '',
    };
    return callback(null,response);
};


