const Post = require("../models/post")
const commentService = require("../services/commentService")

const main = async (event) => {
    const { username, postId } = event.pathParameters
    const { commenterUsername, content } = JSON.parse(event.body)
    const post = new Post(username, postId)

    return await commentService.commentOnPost(post, commenterUsername, content)

}

module.exports = {
    main
}