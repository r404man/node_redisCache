const express = require('express');
const redis = require('redis');
const morgan = require('morgan');
const fetch = require('node-fetch');


const app = express();
app.use(express.static(__dirname + 'public'));


const client = redis.createClient({
    port: 6379,
});




const PORT = 3000 || process.env.PORT;

app.use(morgan('dev'));

// Make request for rocket
async function getRocket(req, res, next) {
    try {
        const { rocket } = req.params;
        const responce = await fetch(`https://api.spacexdata.com/v3/rockets/${rocket}`);

        const data = await responce.json();
        const rate = data.success_rate_pct;

        client.setex(rocket, 3600, rate);

        res.send(`<h1>${rate}</h1>`);
    } catch (err) {
        console.error(err);
        res.status(500).redirect('/');
    }
}


// Middleware cache
function cache(req, res, next) {
    const { rocket } = req.params;
    client.get(rocket, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data !== null) {
            res.send(`<h1>${data}</h1>`);
        }
        else {
            next();
        }
    });
}

app.get('/rockets/:rocket', cache, getRocket);



app.get('/', (req, res) => {
    client.get('id', (err, data) => {
        if (err) console.log(err);

        if (data !== null) {
            res.send(data);
        }
    });
});



app.listen(PORT, console.log(`Server is running on port ${PORT}`));