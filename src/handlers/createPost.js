const Post = require("../models/post")
const postService = require("../services/postService")

const main = async (event) => {
    const { username } = event.pathParameters
    const post = new Post(username)

    return await postService.createPost(post, event)
}

module.exports = {
    main
}