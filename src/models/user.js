const dynamoDBClient = require("./client")

class User {
    constructor(username) {
        this.username = username
    }

    get pk() {
        return `USER#${this.username}`
    }

    get sk() {
        return `USER#${this.username}`
    }

    keys() {
        return {
            PK: { S: this.pk },
            SK: { S: this.sk },
        }
    }

    toItem() {
        return {
            ...this.keys(),
            username: { S: this.username }
        }
    }
}

const createUser = async (user) => {
    const client = dynamoDBClient.getDynamoDBClient()

    try {
        await client
            .putItem({
                TableName: process.env.TABLE_NAME,
                Item: user.toItem(),
                ConditionExpression: "attribute_not_exists(PK)"
            })
            .promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                ...user
            })
        }
    } catch (error) {
        console.error(error)

        // Failed Condition Expression check
        if (error.code === "ConditionalCheckFailedException") {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    message: `The username '${user.username}' already exist.`
                })
            }
        } else {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    message: `Error: ${error.message}`,
                    exceptionCode: `${error.code}`
                })
            }
        }
    }
}

const getUser = async (username) => {
    const client = dynamoDBClient.getDynamoDBClient()
    const user = new User(username)

    try {
        const response = await client
            .getItem({
                TableName: process.env.TABLE_NAME,
                Key: user.keys()
            })
            .promise()

        // If user doesn't exist
        if (!response.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: `The username '${username}' does not exist.`
                })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                ...user
            })
        }
    } catch (error) {
        console.error(error)

        return {
            statusCode: error.statusCode,
            body: JSON.stringify({
                message: `Error: ${error.message}`,
                exceptionCode: `${error.code}`
            })
        }
    }
}

module.exports = {
    User,
    createUser,
    getUser
}