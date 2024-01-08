/*
Created BY: Alex Jackson
Date: 2023-09-05
Conducting a load test to test the number of concurrent
request the system can handle when logging in:

Endpoint: 'https://myipo-st-portalservice.my.com/IPOPortalService/api/v1/auth/login'

*/

const axios = require('axios');
const PromisePool = require('es6-promise-pool');

// Define your load test parameters
const CONCURRENCY = 10;
const TOTAL_REQUESTS = 10;

let count = 0;

console.log(`CONCURRENCY`, CONCURRENCY);
console.log(`TOTAL_REQUESTS`, TOTAL_REQUESTS);

// This function returns a new promise that performs the HTTP request
function doRequest() {
  return new Promise(async (resolve, reject) => {
    if (count >= TOTAL_REQUESTS) {
      resolve();
      return;
    }

    count++;

    try {console.log(`api running now`, count);
      const response = await axios.post(
        'https://myipo-st-portalservice.my.com/IPOPortalService/api/v1/auth/login', 
        {
          "username": "alicia",
          "password": "Password@1"
        }, 
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`username and password entered`);
      console.log(`Request ${count} succeeded with status code: ${response.status}`);
      resolve();
    } catch (error) {
      console.error(`Request ${count} failed with error: ${error}`);
      reject(error);
    }
  });
}


// The constructor argument to PromisePool is a generator function
// This function should yield new promises
function promiseProducer() {
  if (count < TOTAL_REQUESTS) {
    return doRequest();
  } else {
    return null;
  }
}

const pool = new PromisePool(promiseProducer, CONCURRENCY);

pool.start().then(() => {
  console.log(`All ${TOTAL_REQUESTS} requests finished.`);
});
