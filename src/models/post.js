const ULID = require('ulid')
const dayjs = require('dayjs')
const dynamoDBClient = require("./client")

class Post {
    constructor(username, postId = ULID.ulid(), commentCount, createdDate) {
        this.username = username
        this.postId = postId
        this.commentCount = commentCount || 0
        this.createdDate = createdDate || dayjs().format()
    }

    get pk() {
        return `USERPOST#${this.username}`
    }

    get sk() {
        return `POST#${this.postId}`
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
            username: { S: this.username },
            postId: { S: this.postId },
            commentCount: { N: this.commentCount.toString() },
            createdDate: { S: this.createdDate }
        }
    }
}

const createPost = async (post) => {
    const client = dynamoDBClient.getDynamoDBClient()

    try {
        await client
            .transactWriteItems({
                // Both of the below operations will fail if even one of them fails (doesn't meet the conditions)
                TransactItems: [
                    {
                        // Check if user exists before allowing to post
                        ConditionCheck: {
                            TableName: process.env.TABLE_NAME,
                            Key: {
                                PK: { S: `USER#${post.username}` },
                                SK: { S: `USER#${post.username}` }
                            },
                            ConditionExpression: "attribute_exists(PK)"
                        }
                    },
                    {
                        Put: {
                            TableName: process.env.TABLE_NAME,
                            Item: post.toItem(),
                            ConditionExpression: "attribute_not_exists(PK)"
                        }
                    }
                ]
            })
            .promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                ...post
            })
        }
    } catch (error) {
        console.error(error)

        // Failed Condition Expression check
        if (error.code === "TransactionCanceledException") {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    message: `Cannot create post as user '${post.username}' doesn't exist.`
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

const getPost = async (username, postId) => {
    const client = dynamoDBClient.getDynamoDBClient()
    const post = new Post(username, postId)

    try {
        const response = await client
            .getItem({
                TableName: process.env.TABLE_NAME,
                Key: post.keys()
            })
            .promise()

        // If post with specified postId doesn't exist
        if (!response.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: `A post with the postId '${postId}' does not exist.`
                })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                username: response.Item.username.S,
                postId: response.Item.postId.S,
                commentCount: Number(response.Item.commentCount.N),
                createdDate: response.Item.createdDate.S,
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

const getPostsByUser = async (username) => {
    const client = dynamoDBClient.getDynamoDBClient()

    try {
        const response = await client
            .query({
                TableName: process.env.TABLE_NAME,
                KeyConditionExpression: "PK = :postsByUser",
                ExpressionAttributeValues: {
                    ":postsByUser": { S: `USERPOST#${username}` }
                },
                ProjectionExpression: "postId, createdDate, commentCount",
                ScanIndexForward: false
            })
            .promise()
        const postsByUsers = response.Items
        let postByUsersWithComments = []

        for (const post of postsByUsers) {
            comments = await getCommentsForPost(post.postId.S)
            result = {
                postId: post.postId.S,
                createdDate: post.createdDate.S,
                commentCount: post.commentCount.N,
                recentComments: comments
            }
            postByUsersWithComments.push(result)
        }
        postByUsersWithComments.sort((a, b) => b.commentCount - a.commentCount) // Sort posts by number of comments desc

        return {
            statusCode: 200,
            body: JSON.stringify({
                username: username,
                posts: postByUsersWithComments
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

const getCommentsForPost = async (postId) => {
    const client = dynamoDBClient.getDynamoDBClient()

    try {
        const response = await client
            .query({
                TableName: process.env.TABLE_NAME,
                KeyConditionExpression: "PK = :postComments",
                ExpressionAttributeValues: {
                    ":postComments": { S: `POSTCOMMENT#${postId}` }
                },
                ProjectionExpression: "commentId, createdDate, commenterUsername, content, postId",
                ScanIndexForward: false, // Return posts sorted by descending date, already sorted by DynamoDB Sort Key
                Limit: 2 // Limit to two most recent comments
            })
            .promise()

        return response.Items.map(item => fromItem(item))
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

const fromItem = (item) => {
    return {
        commentId: item.commentId.S,
        createdDate: item.createdDate.S,
        commenterUsername: item.commenterUsername.S,
        content: item.content.S,
        postId: item.postId.S
    }
}

module.exports = {
    Post,
    createPost,
    getPost,
    getPostsByUser
}