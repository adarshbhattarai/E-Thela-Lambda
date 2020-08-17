'use strict'

const AWS= require('aws-sdk')

AWS.config.update({region:"us-east-2"});

exports.handler = async (event, context, callback) => {
   
    const {cartItems, userInfo} =  JSON.parse(event.body);
    //Limiting to 24, because at once only 24 batchWrites can be made.
    //We will ofcourse do it multiple times in the future when the item grows its size.
    if(!cartItems || !userInfo || cartItems.length > 24){
    
        console.error("Somethings Quite not right " )
        console.error("CartItems " + cartItems);
        console.error("Info " + userInfo);

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


    const batchParam = {
        RequestItems : {
            Products: {
                Keys : []
            }
        }
    }

    var batchParamKeys = [];
    var quantityDict = {};
    for(var items of  cartItems){
        var item={
            Id:items.id,
            Name:items.name
        };
        batchParamKeys.push(item)
        if( items.id in quantityDict ){
            quantityDict[items.id]+=items.quantity;
        }else{
            quantityDict[items.id]=items.quantity;
        }
    }

    batchParam.RequestItems.Products.Keys = batchParamKeys;
    const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion : "2012-10-08" })

    var totalProductAmount = 0;

    var txnId = "NPS"+getRandomId().toUpperCase();
   
    //Limited to 24, batchWrite supports 25 puts. Error is thrown if more during validation above.
    const orderItemBatchParam = [];
    try{

        const data = await documentClient.batchGet(batchParam).promise();

        for(var item of data.Responses.Products){
            totalProductAmount += item.Price * quantityDict[item.Id]; 
            var Item = {
                PutRequest:{
                        Item:{
                            pk:"ITEM#"+item.Id,
                            sk:"ORDER#"+txnId,
                            itemId:item.Id,
                            orderId:txnId,
                            productName:item.Name,
                            supplier:item.Category,
                            price:item.Price,
                            quantity:quantityDict[item.Id],
                            status:'PLACED',
                            image:item.image
                        }
                    }
                };
            orderItemBatchParam.push(Item);
        }

    }catch (err) {

        console.log(err);

    }

    var deliveryCharge = 10/100*totalProductAmount;
    var total = totalProductAmount + deliveryCharge;

    const UserOrder = [{

        PutRequest:{
            Item:{
                pk : "USER#"+userInfo.email,
                sk : "ORDER#"+txnId,
                orderId:txnId,
                status:"INITIATED",
                payment:"PENDING",
                address:userInfo,
                paymentOption:"CASH",
                createdAt: new Date().toLocaleString(),
                orderTotal:totalProductAmount,
                deliverFee:deliveryCharge,
                total:total,
                paidAmount:0
            }
        }
    }]


    const batchWriteItems = [...UserOrder,...orderItemBatchParam]
    const batchWriteOrderParams = {
        RequestItems : {
            UserOrder : batchWriteItems
        }
    }
    documentClient.batchWrite(batchWriteOrderParams,(err,data)=>{
        if(err){
            console.log(err);
        }
        console.log(data);
    })
    

    var responseBody = {
        id:txnId,
        amount:total,
        name:txnId,
        items:orderItemBatchParam.map((request)=>request.PutRequest.Item)
        .map((items)=>({itemId:items.itemId,productName:items.productName,quantity:items.quantity,price : items.price}))
    }
     const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(responseBody),
    };
    return callback(null,response);
};


function getRandomId(){
    return (new Date().getTime()).toString(36);
}

