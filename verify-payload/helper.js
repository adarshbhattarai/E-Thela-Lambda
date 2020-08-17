"use-strict";

exports.getItemsById =  async (orderId,documentClient) => {
    const sk = orderId;
    const param = {
        TableName :"UserOrder",
        IndexName:"sk-pk-index",
        KeyConditionExpression: 'sk = :sk AND begins_with ( pk , :pk )',
        ExpressionAttributeValues: {
            ':sk': sk,
            ':pk': "ITEM#"
          },
    }
    try{
        console.log(param)
        const data = await documentClient.query(param).promise();
        return data;
    }catch (err) {
        console.log(err);
        return null;
    }
}

exports.formatData =  (inputJson,items) =>{

    var emailBody={};
    emailBody["orderNumber"]= inputJson.orderId;
    emailBody["firstName"] = inputJson.address.firstName;
    emailBody["emailAddress"]=inputJson.address.email;
    emailBody["phoneNumber"] = inputJson.address.phoneNumber1 || inputJson.address.phoneNumber2;
    emailBody["address"] = inputJson.address.address;
    
    emailBody["items"]=[];
    items.Items.map((item)=>{
        var Name = item.productName;
        var quantity = item.quantity;
        var price =  item.price;
        var totalPrice = price*quantity;
        emailBody.items.push({
            "Name": Name,
            "quantity":item.quantity,
            "price":item.price,
            "totalPrice": totalPrice
        });
    })

    emailBody["deliveryFee"] = inputJson.deliverFee;
    emailBody["totalAmount"] = inputJson.total;
    
    return emailBody;

}


const findRecordfromDDB = async (body, documentClient)=>{

    console.log("findRecordfromDDB")
    const pk = body.product_name;
    const sk = body.product_identity;

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