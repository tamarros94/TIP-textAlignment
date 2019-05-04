var MongoClient = require('mongodb').MongoClient;

var matches;

 const initMongo  = async () => {
    const client = await MongoClient.connect("mongodb://localhost:27017/textAlignment");
    matches = client.db("textAlignment").collection('matches');
};

 const matchesCollection = () => matches;

module.exports = {
    initMongo,
    matchesCollection
};