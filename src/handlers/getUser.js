const userService = require("../services/userService")

const main = async (event) => {
    const { username } = event.pathParameters
    
    return await userService.getUser(username)
}

module.exports = {
    main
}