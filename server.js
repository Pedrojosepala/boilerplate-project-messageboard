'use strict';
require('dotenv').config({ path: './.env' });
console.log("DB URI:", process.env.DB);
if (!process.env.DB) {
  throw new Error("La variable de entorno DB no está definida. Revisa .env");
}

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

// === Security Configurations ===
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sample front-end
app.route('/b/:board/').get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid').get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/').get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// For FCC testing purposes
fccTestingRoutes(app);

// Routing for API: pasamos la URI de MongoDB
apiRoutes(app, process.env.DB);

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// Start server and tests
const listener = app.listen(process.env.PORT || 3000, function() {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Your app is listening on port ' + listener.address().port);
  }
});

module.exports = app;