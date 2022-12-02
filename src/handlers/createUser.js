const User = require("../models/user")

const main = async(event) => {
    const { username } = JSON.parse(event.body)
    const user = new User.User(username)
    
    return await User.createUser(user)
}

module.exports = {
    main
}