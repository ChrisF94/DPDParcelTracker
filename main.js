const PORT = 8000;
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sql = require('mssql');
const app = express();
app.use(cors());

const config = {
    server: "localhost\\SQLEXPRESS",
    port: 1443,
    user: "root",
    password: "",
    database: "DPD",
    options:{
        enableArithAbort: true
    },
    connectionTimeout: 30000,
    pool:{
        max:10,
        min:0,
        idleTimeoutMillis: 30000
    }
}

sql.on('error', err => {
    console.log(err);
});


function getTrackingStatus(parcelNumber) {
    axios.get('https://apis.track.dpd.co.uk/v1/reference?referenceNumber=' + parcelNumber)
        .then(async response => {
            const theData = response.data.data[0].parcelStatus;

            if (theData.includes('delivered')) {
                var delivered = 'Yes';
            } else {
                var delivered = 'No';
            }

            try {
                let pool = await sql.connect(config);
                await pool.request().query(`UPDATE parcels SET delivered = '${delivered}' WHERE parcelNumber = '${parcelNumber}'`);
                sql.close();
            } catch (err) {
                console.log(err);
                sql.close();
            }
            

           
        }).catch(error => {
            console.log(error);
        });
}

async function getTrackingNumbers() {
    try {
        let pool = await sql.connect(config);
        await pool.request().query(`SELECT parcelNumber FROM parcels WHERE delivered = ""`), (err, result) => {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < result.recordset.length; i++) {
                    setTimeout(() => {
                        console.log(parcelNumber);
                        getTrackingStatus(result.recordset[i].parcelNumber);
                    }, index * 1000);
                }
            }
        }
        sql.close();
    } catch (err) {
        console.log(err);
        sql.close();
    }

    return "DPD API call complete";
}

app.get('/', (req, res) => {
    res.json(getTrackingNumbers());
});

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))