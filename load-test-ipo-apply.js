/*
Created BY: Alex Jackson
Date: 2023-09-05
Conducting a load test to test the number of concurrent
request the system can handle when creating ipo applications:

Endpoint: 'https://myipo-st-portalservice.my.com/IPOPortalService/api/v1/ipos/orders'
*/


const axios = require('axios');
const https = require('https');
const PromisePool = require('es6-promise-pool');
const { log } = require('console');

const CONCURRENCY = 10;
const TOTAL_REQUESTS = 100;
const RETRY_DELAY = 1000;

let count = 0;
let errorCount = 0;
let token = '';

const username = "myuser";
const password = "p@55w0rd";

// Keep track of the start time, number of requests per second, and requests per minute
let startTime;
let startTimeForMinute;
let requestsPerSecond = 0;
let requestsPerMinute = 0;

// Function for delay
const delay = (interval) => {
    return new Promise((resolve) => {
        setTimeout(resolve, interval);
    });
};

const login = async () => {
    try {
        let Loginresponse = await axios({
            method: 'post',
            url: 'https://myipo-st-portalservice.my.com/IPOPortalService/api/v1/auth/login',
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                username: "alicia",
                password: "Password@1"
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            auth: {
                username: username,
                password: password
            },
        });
        token = Loginresponse.data.access_token;
        console.log("Successfully logged in");
    } catch (error) {
        console.log(`Login failed. Error: ${error}`);
        throw error;
    }
    console.log(`logging in ${username}`);
};

async function CreateOrder() {
    if (count >= TOTAL_REQUESTS) {
        return;
    }

    const currentCount = count++;
    const dateNow = new Date();
    console.log(dateNow.toLocaleDateString() + ` Creating ipo order ${currentCount + 1}`);

    try {
        const ipoResponse = await axios({
            method: 'POST',
            url: 'https://myipo-st-portalservice.my.com/IPOPortalService/api/v1/ipos/orders',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'  
            },
            data:{
                user_name: "alicia",
                ipo_id: 35,
                pool_id: 36,
                stock_exchange_account: 9870783,
                refund_account_id: 28,
                quantity: 20000,
                note: "RUNNING LOAD TEST",
                terms: true,
                Is_business: false
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
        });

        // Checking if response is 401, user would login again to generate a new token 
        if (!ipoResponse.ok && ipoResponse.status === 401) {
            console.log(`logging in again....`);
            await login();  
        }    

        console.log(dateNow.toLocaleDateString() + ` Request number ${currentCount + 1} was successful | ${ipoResponse.data}`);
    } catch (error) {
        errorCount++;
        console.log(dateNow.toLocaleDateString() + ` Request number ${currentCount + 1} failed. Error: ${error}`);

        // If any error occurs, wait for 1 second before next request
        console.log(`Error occurred, waiting for 1 second before retrying...`);
        await delay(RETRY_DELAY);
        console.log('Restarting the request...');
        return CreateOrder();
    }

    // Increment requests per second counter
    if (Date.now() - startTime < 1000) {
        requestsPerSecond++;
    } else {
        console.log(`Requests per second: ${requestsPerSecond}`);
        startTime = Date.now();
        requestsPerSecond = 1;
    }

    // Increment requests per minute counter
    if (Date.now() - startTimeForMinute < 60000) {
        requestsPerMinute++;
    } else {
        console.log(`Requests per minute: ${requestsPerMinute}`);
        startTimeForMinute = Date.now();
        requestsPerMinute = 1;
    }
}

function promiseProducer() {
    if (count < TOTAL_REQUESTS) {
        return CreateOrder();
    } else {
        return null;
    }
}

// Start the load test
const startLoadTest = async () => {
    await login();
    startTime = Date.now(); // Initialize the start time for seconds
    startTimeForMinute = Date.now(); // Initialize the start time for minutes

    const pool = new PromisePool(promiseProducer, CONCURRENCY);

    pool.start().then(() => {
        console.log(new Date().toLocaleDateString() + ` Load test complete. Total requests: ${count}. Total errors: ${errorCount}.`);
    });
}

startLoadTest();
