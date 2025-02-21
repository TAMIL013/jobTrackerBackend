const AWS = require('aws-sdk')
AWS.config.update({
    region:"ap-southeast-1",
    accessKeyId:"",
    secretAccessKey:""
})

const dynamoDB= new AWS.DynamoDB.DocumentClient()
const dynamoDBDoc = new AWS.DynamoDB()

module.exports= {dynamoDBDoc ,dynamoDB}