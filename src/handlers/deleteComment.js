const Comment = require("../models/comment")
const Post = require("../models/post")

const main = async (event) => {
    const { username, postId, commentId } = event.pathParameters
    const { deletingUsername } = JSON.parse(event.body)
    const post = new Post.Post(username, postId)
    
    return await Comment.deleteComment(post, deletingUsername, commentId)
}

module.exports = {
    main
}