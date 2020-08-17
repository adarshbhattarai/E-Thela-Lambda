//https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ses-examples-creating-template.html
    var params = {
        Template: { 
          TemplateName: 'USER_ORDER_ITEM_EMAIL', /* required */
          HtmlPart: '<h1>AWS Amazon Simple Email Service Test Email</h1><p>This email was sent with <a href=\"https://aws.amazon.com/ses/\">Amazon SES</a> using the <a href=\"https://aws.amazon.com/sdk-for-php/\">AWS SDK for PHP</a>.</p>',
          SubjectPart: 'Thank you for placing your order with us',
          TextPart: 'Your order for has been placed'
        }
      };
      // Create the promise and SES service object
      var templatePromise = new AWS.SES({apiVersion: '2010-12-01'}).createTemplate(params).promise();
      
      // Handle promise's fulfilled/rejected states
      templatePromise.then(
        function(data) {
          console.log(data);
        }).catch(
          function(err) {
          console.error(err, err.stack);
        });