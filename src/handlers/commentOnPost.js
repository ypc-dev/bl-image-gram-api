const Comment = require("../models/comment")
const Post = require("../models/post")

const main = async (event) => {
    const { username, postId } = event.pathParameters
    const { commenterUsername, content } = JSON.parse(event.body)
    const post = new Post.Post(username, postId)

    return await Comment.commentOnPost(post, commenterUsername, content)

}

module.exports = {
    main
}