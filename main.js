const PORT = 8000;
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sql = require('mssql');
const app = express();
app.use(cors());

var Connection = require('tedious').Connection;
var config = {
    server: 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: '', //DB Username
            password: '' //DB Password
        }
    },
    options: {
        trustServerCertificate: true,
        database: '', //DB
        instanceName: 'LOCALHOST'
    }
}
var connection = new Connection(config);
connection.on('connect', function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected');
        executeStatement();
    }
});

connection.connect();

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

function executeStatement() {
    request = new Request("SELECT parcelNumber FROM parcels WHERE delivered ='No'", function (err) {  //Replace parcelNumber with your table name
        if (err) {
            console.log(err);
        }
    });

    var result = "";
    var loop = 1;
    request.on('row', function (row) {
        var ParcelNumber = row[0].value;
        setTimeout(() => {
            getTrackingStatus(ParcelNumber);
        }, loop * 500); //Amount of seconds to loop

        loop++;
    });
    connection.execSql(request);
}
function getTrackingStatus(ParcelNumber) {
    axios.get('https://apis.track.dpd.co.uk/v1/reference?referenceNumber=' + ParcelNumber)
        .then(async response => {
            const theData = response.data.data[0].parcelStatus;
            if (theData.includes('delivered')) {
                var delivered = 'Yes';
            } else {
                var delivered = 'No';
            }
            try {
                let pool = await sql.connect(config);
                await pool.request().query(`UPDATE parcels SET delivered = '${delivered}', parcelStatus = '${theData}' WHERE parcelNumber = '${ParcelNumber}'`);
                console.log(delivered);
                sql.close();
            } catch (err) {
                console.log(err);
                sql.close();
            }
        }).catch(error => {
            console.log(error);
        });
}
app.get('/', (req, res) => {
    res.json();
});