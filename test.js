const bcrypt = require('bcrypt');
const saltRounds = 10;

let newPassword = bcrypt.hashSync('myPlaintextPassword', saltRounds)

console.log(newPassword)


console.log(bcrypt.compareSync('myPlaintextPassword', newPassword))
