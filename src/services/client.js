const AWS = require("aws-sdk")

// Use the same client connection if not cold start invocation
let client = null

const getDynamoDBClient = () => {
    if (client) return client
    client = new AWS.DynamoDB()
    
    return client
}

module.exports = {
    getDynamoDBClient
}
