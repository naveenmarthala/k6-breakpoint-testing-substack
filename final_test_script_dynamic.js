import http from 'k6/http';
import { check } from 'k6';


const url = 'http://0.0.0.0:8080/predict';
const headers = {'Content-Type': 'application/json'};
                // 'Connection': 'keep-alive'};
// some sample payloads to send in random
const payload_01 = {"input_matrix": [[[[0.3879, 0.2045, 0.2850, 0.4871],
                                       [0.2640, 0.4860, 0.9306, 0.6901],
                                       [0.2830, 0.3316, 0.8404, 0.9194],
                                       [0.9132, 0.5200, 0.5266, 0.5509]],
                                      [[0.6306, 0.6859, 0.6948, 0.9534],
                                       [0.4894, 0.8682, 0.9207, 0.2763],
                                       [0.5308, 0.1817, 0.1540, 0.4378],
                                       [0.1836, 0.0265, 0.6769, 0.1860]],
                                      [[0.1508, 0.6728, 0.4751, 0.7453],
                                       [0.4481, 0.2678, 0.7070, 0.4812],
                                       [0.0802, 0.7102, 0.2592, 0.7463],
                                       [0.0631, 0.5948, 0.9220, 0.1469]]]]};
const payload_02 = {"input_matrix": [[[[0.7692, 0.5300, 0.9162, 0.9857],
                                        [0.8326, 0.3901, 0.7813, 0.4834],
                                        [0.2901, 0.6730, 0.6272, 0.0487],
                                        [0.3049, 0.9049, 0.5384, 0.7479]],
                                    [[0.6420, 0.4234, 0.0471, 0.3240],
                                        [0.6468, 0.7151, 0.4310, 0.3476],
                                        [0.3045, 0.4223, 0.6565, 0.3313],
                                        [0.7346, 0.1690, 0.4151, 0.6626]],
                                    [[0.2062, 0.0584, 0.7122, 0.1181],
                                        [0.6671, 0.1742, 0.3850, 0.1205],
                                        [0.9194, 0.4961, 0.9123, 0.4024],
                                        [0.2199, 0.5451, 0.8516, 0.6819]]]]};
const payload_03 = {"input_matrix": [[[[0.3565, 0.1776, 0.4698, 0.7150],
                                        [0.6252, 0.1284, 0.4616, 0.4739],
                                        [0.3011, 0.6667, 0.4654, 0.1218],
                                        [0.3238, 0.2125, 0.5165, 0.3544]],
                                    [[0.6623, 0.9909, 0.2158, 0.0340],
                                        [0.6127, 0.7220, 0.0080, 0.5258],
                                        [0.3061, 0.4911, 0.0301, 0.1691],
                                        [0.7295, 0.9954, 0.3277, 0.5197]],
                                    [[0.4174, 0.3553, 0.6107, 0.3232],
                                        [0.3411, 0.8608, 0.7429, 0.9353],
                                        [0.2142, 0.3584, 0.4466, 0.3748],
                                        [0.9133, 0.2072, 0.3267, 0.4306]]]]};
const payload_04 = {"input_matrix": [[[    0.8830,     0.7646,     0.0784,     0.2515],
                                        [    0.0902,     0.3544,     0.3150,     0.3922],
                                        [    0.1416,     0.0538,     0.9914,     0.3129],
                                        [    0.2785,     0.1315,     0.6683,     0.0128]],

                                    [[    0.1257,     0.0199,     0.6138,     0.4507],
                                        [    0.3231,     0.9592,     0.4188,     0.8280],
                                        [    0.7085,     0.5807,     0.9339,     0.1423],
                                        [    0.6567,     0.6829,     0.8432,     0.8691]],

                                    [[    0.6012,     0.2292,     0.6867,     0.1337],
                                        [    0.8851,     0.2734,     0.2114,     0.1649],
                                        [    0.6154,     0.3491,     0.8406,     0.5106],
                                        [    0.6415,     0.4395,     0.8378,     0.3049]]]};
// an array from which a random value will be packed for payload
const all_payloads = [payload_01, payload_02, payload_03, payload_04];

// Arrays defining scaling factors, start times, and durations for each scenario
const multipliers = [  1,    2,    3,    4,    5,   20,     7,    8,     30,    10,    11,     2,     13,    5]; // Multipliers to scale the request rate
const durations =   ['1m', '1m', '1m', '3m', '2m', '3m',  '1m',  '1m',  '3m',  '1m',  '2m',  '3m',  '2m', '10m']; // Duration of each scenario
const start_times = ['0m', '1m', '2m', '3m', '6m', '8m', '11m', '12m', '13m', '16m', '17m', '19m', '22m', '24m']; // Start times for each scenario (in minutes)

// Ensure all arrays have the same length or handle differences or use the lenght of the shortest array of 3 to prevent index errors
const maxScenarios = Math.min(multipliers.length, start_times.length, durations.length);

// a constant to set the number of iterations, which gets multiplied or divided during the stages of the test.
// this constant can also be the number of requests your API can handle in a couple of milliseconds, or may <5ms.
const baseRPS = 500;
const maxVUs = 2000;

// Initialize an object to store dynamically generated scenarios
let scenarios = {};

// Populate the `scenarios` object dynamically based on the arrays
for (let i = 0; i < maxScenarios; i++) {
    let scenarioName = `scenario_${String(i + 1).padStart(2, '0')}`; // Format scenario name as "scenario_01", "scenario_02", etc.

    scenarios[scenarioName] = {
        executor: 'constant-arrival-rate', // Use constant arrival rate for traffic simulation
        rate: baseRPS * multipliers[i],  // Adjust request rate based on multiplier
        timeUnit: '1s', // Requests per second
        duration: durations[i], // Scenario duration
        preAllocatedVUs: maxVUs, // Maximum virtual users allocated for the scenario
        startTime: start_times[i] // Time when the scenario starts
    };
};


// https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
export let options = {
    // // A number specifying a fixed number of iterations to execute of the script; together with the vus option, 
    // // it’s a shortcut for a single scenario with a shared iterations executor
    // // https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#iterations
    
    // A boolean specifying whether k6 should ignore TLS verifications for connections established from code
    insecureSkipTLSVerify: true,

    // A boolean specifying whether k6 should disable keep-alive connections.
    // Setting it to true, to replicate each request to have come from a different user, which requires TCP handshake and DNS lookup.
    noConnectionReuse: true,
    noVUConnectionReuse: true,

    // custom summary stats of the overall test
    summaryTrendStats: ["min", "avg", "med", "p(80)", "p(90)","p(95)", "p(99)", "p(99.50)", "p(99.90)", "p(99.975)", "p(99.99)", "max"],
    
    // thresholds to be passed
    thresholds: {
        // https://grafana.com/docs/k6/latest/using-k6/thresholds/#aggregation-methods-by-type
        
        // median time taken for requests should be 50 milliseconds and and maximum can't be twice that.
        http_req_duration: ["med<50", 'p(95)<55', 'p(99.9)<65', 'p(99.99)<80', 'max<120'],
        
        // During the whole test execution, the rate of requests resulting in error must be lower than 1%.
        http_req_failed: ['rate<0.01'],

        // the rate of successful HTTP status code checks should be higher than 99%.
        checks: ['rate>0.99'],

        // Server must not take too long to send the data
        http_req_waiting: ["avg<5", 'p(95)<8', 'p(99.9)<15', 'max<20'],
      },
      
      // add here, the scenarios created above
      scenarios: scenarios
}; 


export default function () {
    let response = http.post(url, JSON.stringify(all_payloads[Math.floor(Math.random() * 4)]), {headers});

    // ensure that the ouptut status is 200
    check (response, {
        'status is 200': response.status === 200,
        // 'output contains relevant keys': response.json() === 200,
    });
}
