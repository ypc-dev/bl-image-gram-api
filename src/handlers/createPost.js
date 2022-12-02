const Post = require("../models/post")

const main = async (event) => {
    const { username } = event.pathParameters
    const post = new Post.Post(username)

    return await Post.createPost(post)
}

module.exports = {
    main
}