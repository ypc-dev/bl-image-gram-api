const ULID = require('ulid')
const dayjs = require('dayjs')

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

module.exports = Comment
