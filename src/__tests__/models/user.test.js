const User = require("../../models/user");

describe("Test User class", () => {
    const username = "John"
    let user
    
    beforeEach(() => {
        user = new User(username)
    })

    it("should return correct username", () => {
        expect(user.username).toEqual(username) 
    })

    it("should return correct PK", () => {
        expect(user.pk).toEqual(`USER#${username}`) 
    })

    it("should return correct SK", () => {
        expect(user.sk).toEqual(`USER#${username}`) 
    })

    it("should return correct DynamoDB keys", () => {
        expectedKeys = {
            PK: { S: `USER#${username}` },
            SK: { S: `USER#${username}` }
        }

        expect(user.keys()).toEqual(expectedKeys)
    })

    it("should return correct whole item", () => {
        expectedItem = {
            PK: { S: `USER#${username}` },
            SK: { S: `USER#${username}` },
            username: { S: username }
        }

        expect(user.toItem()).toEqual(expectedItem)
    })
})