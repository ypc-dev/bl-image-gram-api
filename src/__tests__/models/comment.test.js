const dayjs = require('dayjs')
const ULID = require('ulid')
const Comment = require("../../models/comment")

describe("Test Comment class", () => {
    const postId = ULID.ulid()
    const commenterUsername = "Mary"
    const content = "This is a comment"
    const commentId = ULID.ulid()
    const createdDate = dayjs().format()
    let comment
    
    beforeEach(() => {
        comment = new Comment(postId, commenterUsername, content, commentId)
        comment.createdDate = createdDate
    })

    it("should return correct properties", () => {
        expect(comment.postId).toEqual(postId) 
        expect(comment.commenterUsername).toEqual(commenterUsername) 
        expect(comment.content).toEqual(content) 
        expect(comment.commentId).toEqual(commentId) 
        expect(comment.createdDate).toEqual(createdDate) 
    })

    it("should return correct PK", () => {
        expect(comment.pk).toEqual(`POSTCOMMENT#${postId}`) 
    })

    it("should return correct SK", () => {
        expect(comment.sk).toEqual(`COMMENT#${commentId}`) 
    })

    it("should return correct DynamoDB keys", () => {
        expectedKeys = {
            PK: { S: `POSTCOMMENT#${postId}` },
            SK: { S: `COMMENT#${commentId}` }
        }

        expect(comment.keys()).toEqual(expectedKeys)
    })

    it("should return correct whole item", () => {
        expectedItem = {
            PK: { S: `POSTCOMMENT#${postId}` },
            SK: { S: `COMMENT#${commentId}` },
            commentId: { S: commentId },
            postId: { S: postId },
            commenterUsername: { S: commenterUsername },
            content: { S: content },
            createdDate: { S: createdDate }
        }

        expect(comment.toItem()).toEqual(expectedItem)
    })

    it("should return correct properties when commentId not provided in constructor", () => {
        const CommentTwo = new Comment(postId, commenterUsername, content)
        expect(CommentTwo.commentId).toBeTruthy()
    })
})