const Post = require("../models/post")
const commentService = require("../services/commentService")

const main = async (event) => {
    const { username, postId, commentId } = event.pathParameters
    const { deletingUsername } = JSON.parse(event.body)
    const post = new Post(username, postId)
    
    return await commentService.deleteComment(post, deletingUsername, commentId)
}

module.exports = {
    main
}