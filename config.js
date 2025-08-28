const config = require('./config.js');
console.log("DB URI:", config.DB);
process.env.DB = config.DB;
