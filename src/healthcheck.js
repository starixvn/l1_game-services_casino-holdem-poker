import http from "http";

import appConfigs from './app-configs';

const options = {
    timeout: 2000,
    host: "localhost",
    port: process.env.PORT || appConfigs.hostingPort,
    path: "/", // must be the same as HEALTHCHECK in Dockerfile
};

const request = http.request(options, (res) => {
    process.exitCode = res.statusCode === 200 ? 0 : 1;
    process.exit();
});

request.on("error", function (err) {
    process.exit(1);
});

request.end();
