const postService = require("../services/postService")

const main = async (event) => {
    const { username, postId } = event.pathParameters
    
    return await postService.getPost(username, postId)
}

module.exports = {
    main
}