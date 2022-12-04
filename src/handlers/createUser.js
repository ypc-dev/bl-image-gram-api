const User = require("../models/user")
const userService = require("../services/userService")

const main = async (event) => {
    const { username } = JSON.parse(event.body)
    const user = new User(username)
    
    return await userService.createUser(user)
}

module.exports = {
    main
}