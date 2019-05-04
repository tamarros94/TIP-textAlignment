var express = require('express');
const mongoClient = require('../framework/mongo');
var router = express.Router();

/* GET users listing. */
router.post('/', async (req, res) => {
    const matches = mongoClient.matchesCollection();
    await matches.insert(req.body);
    res.send('matches');
});

module.exports = router;
