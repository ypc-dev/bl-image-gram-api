const Post = require("../models/post")

const main = async (event) => {
    const { username } = event.pathParameters
    
    return await Post.getPostsByUser(username)
}

module.exports = {
    main
}