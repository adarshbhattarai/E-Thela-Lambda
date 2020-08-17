'use strict';

var inputJson={
    deliverFee: 14,
    orderId: 'NPSKDWLUULW',
    status: 'PLACED',
    total: 154,
    payment: 'DUE',
    createdAt: '8/16/2020, 4:44:41 AM',
    sk: 'ORDER#NPSKDWLUULW',
    orderTotal: 140,
    address: {
      firstName: 'Adarsh',
      lastName: 'Bhattarai',
      address: '8701 Beacontree Lane',
      instruction: '',
      phoneNumber1: '',
      phoneNumber2: '16414514543',
      email: 'adarsh.bhat7@gmail.com'
    },
    paymentOption: 'CASH',
    paidAmount: 0,
    pk: 'USER#adarsh.bhat7@gmail.com'
  }

  var items= {Items:[
                {
            "quantity": 1,
            "orderId": 'NPSKDWLUULW',
            "status": 'INITIATED',
            "sk": 'ORDER#NPSKDWLUULW',
            "itemId": '1',
            "address": "[Object]",
            "price": 70,
            "pk": 'ITEM#1',
            "supplier": 'Flour',
            "productName": 'Momo Wrapper - 1 Packet'
            },
            {
            "quantity": 3,
            "orderId": 'NPSKDWLUULW',
            "status": 'INITIATED',
            "sk": 'ORDER#NPSKDWLUULW',
            "itemId": '2',
            "address": "[Object]",
            "price": 70,
            "pk": 'ITEM#2',
            "supplier": 'Vegetable',
            "productName": 'Lasun - 1 Batta'
            }
        ]}


function formatData(){

    var emailBody={};
    emailBody["orderNumber"]= inputJson.orderId;
    emailBody["firstName"] = inputJson.address.firstName;
    emailBody["emailAddress"]=inputJson.address.email;
    emailBody["phoneNumber"] = inputJson.address.phoneNumber1 || inputJson.address.phoneNumber2;
    emailBody["address"] = inputJson.address.address;
    emailBody["paymentStatus"] = inputJson.payment;
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

    console.log(emailBody)
    console.log(JSON.stringify(emailBody));

}

formatData();