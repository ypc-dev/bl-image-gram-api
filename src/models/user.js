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

module.exports = User
