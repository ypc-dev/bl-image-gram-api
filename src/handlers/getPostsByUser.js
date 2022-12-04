const postService = require("../services/postService")

const main = async (event) => {
    const { username } = event.pathParameters
    
    return await postService.getPostsByUser(username)
}

module.exports = {
    main
}