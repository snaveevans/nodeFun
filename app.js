var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Promise = require("bluebird");
var db = require('./db');
var Account = require('./domain/Account');

// TODO: create helper class to retrieve entities from persistance

db.initialize();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('client'));

app.use((req, res, next) => {
    Promise.onPossiblyUnhandledRejection(error => {
        console.error(error);
        res.status(500).send({ error: "well i tried" });
    })
    next();
});

app.use((req, res, next) => {
    if (req.user && req.user.sub) {
        Account.findById(req.user.sub)
            .then(account => {
                if (account) {
                    req.account = account;
                }
                return next();
            })
    }
    else
        return next();
});

app.get('/version', (req, res) => res.status(200).send({ version: '1.0.0' }));

var tokenController = require('./controllers/TokenController');
var eventsController = require('./controllers/EventsController');
var addressController = require('./controllers/AddressesController');
var accountsController = require('./controllers/AccountsController');

app.get('/', (req, res) => {
    return res.status(200)
        .sendFile('index.html');
});

var apiRouter = express.Router();
apiRouter.use('/token', tokenController);
apiRouter.use('/events', eventsController);
apiRouter.use('/addresses', addressController);
apiRouter.use('/accounts', accountsController);

app.use('/api', apiRouter);

app.use(function (req, res) {
    if (req.path.startsWith('/api'))
        return res.status(404).send({ error: "This is not the page you are looking for." })

    return res.status(200)
        .sendFile('client/error.html', {root: __dirname });
})

app.use(function (err, req, res) {
    console.error(err);
    res.status(500).send({ error: "You've made your point." });
});

module.exports = app;