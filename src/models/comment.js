const ULID = require('ulid')
const dayjs = require('dayjs')
const dynamoDBClient = require("./client")

class Comment {
    constructor(postId, commenterUsername, content, commentId = ULID.ulid()) {
        this.commentId = commentId
        this.postId = postId
        this.commenterUsername = commenterUsername
        this.content = content
        this.createdDate = dayjs().format()
    }

    get pk() {
        return `POSTCOMMENT#${this.postId}`
    }
    
    get sk() {
        return `COMMENT#${this.commentId}`
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
            commentId: { S: this.commentId },
            postId: { S: this.postId },
            commenterUsername: { S: this.commenterUsername },
            content: { S: this.content },
            createdDate: { S: this.createdDate }
        }
    }
}

const commentOnPost = async (post, commenterUsername, content) => {
    const client = dynamoDBClient.getDynamoDBClient()
    const comment = new Comment(post.postId, commenterUsername, content)

    try {
        await client
            .transactWriteItems({
                // All three of the below operations will fail if even one of them fails (doesn't meet the conditions)
                TransactItems: [
                    {
                        // Check if commenter exists
                        ConditionCheck: {
                            TableName: process.env.TABLE_NAME,
                            Key: {
                                PK: { S: `USER#${commenterUsername}` },
                                SK: { S: `USER#${commenterUsername}` }
                            },
                            ConditionExpression: "attribute_exists(PK)"
                        }
                    },
                    {
                        Put: {
                            TableName: process.env.TABLE_NAME,
                            Item: comment.toItem(),
                            ConditionExpression: "attribute_not_exists(PK)"
                        }
                    },
                    {
                        // Increment comment count for post after comment is created (if post exists)
                        Update: {
                            TableName: process.env.TABLE_NAME,
                            Key: {
                                PK: { S: `USERPOST#${post.username}` },
                                SK: { S: `POST#${post.postId}` }
                            },
                            UpdateExpression: "SET #commentCount = #commentCount + :inc",
                            ExpressionAttributeNames: {
                                "#commentCount": "commentCount"
                            },
                            ExpressionAttributeValues: {
                                ":inc": { N: "1" }
                            }
                        }
                    }
                ]
            })
            .promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                ...comment
            })
        }
    } catch (error) {
        console.error(error)

        // Failed Condition Expression check
        if (error.code === "TransactionCanceledException") {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    message: `Possible failure reasons: the commenter '${commenterUsername}' does not exist, the post '${post.postId}' does not exist.`
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

const deleteComment = async (post, deletingUsername, commentId) => {
    const client = dynamoDBClient.getDynamoDBClient()
    const comment = new Comment(post.postId, deletingUsername, "", commentId)
    
    try {
        await client
            .transactWriteItems({
                // Both of the below operations will fail if even one of them fails (doesn't meet the conditions)
                TransactItems: [
                    {
                        
                        // Check if comment belong to user trying to delete the comment before doing so
                        Delete: {
                            TableName: process.env.TABLE_NAME,
                            Key: comment.keys(),
                            ConditionExpression: "#commenterUsername = :deletingUsername",
                            ExpressionAttributeNames: {
                                "#commenterUsername": "commenterUsername"
                            },
                            ExpressionAttributeValues: {
                                ":deletingUsername": { S: deletingUsername }
                            }
                        }
                    },
                    {
                        // Decrease comment count for post after comment is deleted
                        Update: {
                            TableName: process.env.TABLE_NAME,
                            Key: {
                                PK: { S: `USERPOST#${post.username}` },
                                SK: { S: `POST#${post.postId}` }
                            },
                            UpdateExpression: "SET #commentCount = #commentCount - :dec",
                            ExpressionAttributeNames: {
                                "#commentCount": "commentCount"
                            },
                            ExpressionAttributeValues: {
                                ":dec": { N: "1" }
                            }
                        }
                    }
                ]
            })
            .promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Comment succesfully deleted!",
                postId: post.postId,
                commentId: commentId,
                deletingUsername: deletingUsername
            })
        }
    } catch (error) {
        console.error(error)
        
        // Failed Condition Expression check
        if (error.code === "TransactionCanceledException") {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    message: `Possible failure reasons: the comment '${commentId}' does not belong to the user '${deletingUsername}', the comment '${commentId}' does not exist, the post '${post.postId}' does not exist.`
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

module.exports = {
    Comment,
    commentOnPost,
    deleteComment
}