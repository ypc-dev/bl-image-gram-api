const Post = require("../models/post")

const main = async (event) => {
    const { username, postId } = event.pathParameters
    
    return await Post.getPost(username, postId)
}

module.exports = {
    main
}