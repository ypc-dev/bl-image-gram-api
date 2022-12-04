const dayjs = require('dayjs')
const ULID = require('ulid')
const Post = require("../../models/post");

describe("Test Post class", () => {
    const username = "John"
    const postId = ULID.ulid()
    const imageLink = "https://image.png"
    const createdDate = dayjs().format()
    let post
    
    beforeEach(() => {
        post = new Post(username, postId, imageLink)
        post.createdDate = createdDate
    })

    it("should return correct properties", () => {
        expect(post.username).toEqual(username) 
        expect(post.postId).toEqual(postId) 
        expect(post.imageLink).toEqual(imageLink) 
        expect(post.commentCount).toEqual(0) 
        expect(post.createdDate).toEqual(createdDate) 
    })

    it("should return correct PK", () => {
        expect(post.pk).toEqual(`USERPOST#${username}`) 
    })

    it("should return correct SK", () => {
        expect(post.sk).toEqual(`POST#${postId}`) 
    })

    it("should return correct DynamoDB keys", () => {
        expectedKeys = {
            PK: { S: `USERPOST#${username}` },
            SK: { S: `POST#${postId}` }
        }

        expect(post.keys()).toEqual(expectedKeys)
    })

    it("should return correct whole item", () => {
        expectedItem = {
            PK: { S: `USERPOST#${username}` },
            SK: { S: `POST#${postId}` },
            username: { S: username },
            postId: { S: postId },
            imageLink: { S: imageLink },
            commentCount: { N: "0" },
            createdDate: { S: createdDate }
        }

        expect(post.toItem()).toEqual(expectedItem)
    })

    it("should return correct properties when postId, imageLink not provided in constructor", () => {
        const postTwo = new Post(username)
        expect(postTwo.postId).toBeTruthy()
        expect(postTwo.imageLink).toEqual("") 
    })
})