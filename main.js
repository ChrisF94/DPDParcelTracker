const PORT = 8000;
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
app.use(cors());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'parcelTracker'
});

connection.connect();

function getTrackingStatus(parcelNumber) {
    axios.get('https://apis.track.dpd.co.uk/v1/reference?referenceNumber=' + parcelNumber)
        .then(response => {
            const theData = response.data.data[0].parcelStatus;

            if (theData.includes('delivered')) {
                var delivered = 'Yes';
            }else{
                var delivered = 'No';
            }
            
            connection.query('UPDATE parcels SET parcelStatus = ?, delivered = ? WHERE parcelNumber = ?', [theData, delivered, parcelNumber], (err, result) => {
                if (err) throw err;
            });
        })
        .catch(error => {
            console.log(error);
        });
}

function getTrackingNumbers(){
    connection.query('SELECT parcelNumber FROM parcels WHERE delivered = ""', (err, rows) => {
        if (err) throw err;
        for (let index = 0; index < rows.length; index++) {
            const parcelNumber = rows[index].parcelNumber;
            getTrackingStatus(parcelNumber);
        }
    });     
    return "DPD API call complete";
}

app.get('/', (req, res) => {
    res.json(getTrackingNumbers());
});

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))