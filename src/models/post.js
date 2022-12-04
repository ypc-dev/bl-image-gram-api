const dayjs = require('dayjs')
const ULID = require('ulid')

class Post {
    constructor(username, postId = ULID.ulid(), imageLink, commentCount, createdDate) {
        this.username = username
        this.postId = postId
        this.imageLink = imageLink || ""
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
            imageLink: { S: this.imageLink },
            commentCount: { N: this.commentCount.toString() },
            createdDate: { S: this.createdDate }
        }
    }
}

module.exports = Post
