const User = require("../models/user")

const main = async (event) => {
    const { username } = event.pathParameters
    
    return await User.getUser(username)
}

module.exports = {
    main
}