/// Import Node.js libraries
const pack_ws = require("ws");  // WebSocket library
const {exec} = require("node:child_process");   // library for executing files (like PHP API files)



/// Import WebSocket app information
/*
Import the privateInfo.js files for all of your apps as constants here.
Example of such an import:
*/
const AppName = require("/path/to/app/privateInfo.js");

/*
Add the AppInfo objects from the files you imported above to this list below.
Example of what the final array with only one app should look like:
*/
const apps = [
    AppName.AppInfo
];



/// Create a WebSocket server
/*
The port used here isn't really all that important, if you're using nginx as your web server you
don't need to port forward it, as it will be accessed locally by the nginx server.
Check this guide here for information on how to forward WebSocket requests to the Node.js server:
https://websocket.org/guides/infrastructure/nginx/
I have also included my own example of the nginx server configuration with forwarding of WebSocket
requests set up alongside this JavaScript file.
*/
const server = new pack_ws.Server({port : 2096});
logUpdate("Running on port 2096.");



/// Specify valid request domains
// this array is automatically populated by using the above apps array
let validDomains = [];
for (let i = 0; i < apps.length; i++) {
    validDomains.push(apps[i].domain);
}



/// WebSocket connection handling
server.on("connection", (ws, req) => {  // called when a new connection has been fully established
    ws.isAlive = true;  // used to track whether this WebSocket instance is still open

    // log new connection
    logUpdate("Opened a new WebSocket connection with a client.")
    logUpdate("There " + ((server.clients.size !== 1) ? "are" : "is") + " currently " + 
        server.clients.size + " socket" + ((server.clients.size !== 1) ? "s" : "") +
        " connected to this server.");


    
    // used for extra validation when the client is registering
    ws.originalSource = req.headers.origin;
    ws.originalSource = ws.originalSource.replace("https://", "");

    // immediately reject all clients from invalid domains
    if (validDomains.indexOf(ws.originalSource) === -1) {
        ws.send(btoa(JSON.stringify({
            status : "failed",
            reason : ('Unknown domain "' + clientRequest.data.source + '".')
        })));
    }



    // handle client -> API updates/requests
    ws.on("message", (message) => {
        let clientRequest = JSON.parse(atob(message.toString()));   // request object we received

        // seperate registrations from all other communication types
        if (clientRequest.type !== "registration") {
            let request = clientRequest.data.request;   // store the request type for later

            // search which application's PHP API should handle this client's request
            for (let i = 0; i < validDomains.length; i++) {
                if (ws.source === validDomains[i]) {
                    // prepare and Base64 encode the client's request (to prevent PHP injections)
                    let APIRequest = "php " + apps[i].APIFile + " " +
                        btoa(JSON.stringify(clientRequest.data));
                    
                    // run the API PHP script and pass it the client's request
                    exec(APIRequest, (error, stdout, stderror) => {
                        let serverResponse;
                        let sendToUsers = null;
                        let openItemID = -1;
                        if (error === null) {
                            serverResponse = stdout;

                            console.log(serverResponse);

                            if ('sendToUsers' in JSON.parse(serverResponse).response) {
                                sendToUsers = JSON.parse(serverResponse).response.sendToUsers;
                                openItemID = JSON.parse(serverResponse).response.openItemID;
                                serverResponse = JSON.stringify({
                                    status : JSON.parse(serverResponse).status,
                                    response : JSON.parse(serverResponse).response.response
                                });
                            }

                            // store client data for API -> client updates
                            if (request === "user/data") {
                                ws.userID = JSON.parse(serverResponse).response.userID;
                            } else if (request === "item/open") {
                                ws.openItemID = clientRequest.data.itemID;
                            }
                        } else {
                            // if the API encounters a fatal error let the user know by making the
                            // response global
                            request = "global";
                            serverResponse = '{"status":"failed","response":{"reason":"The API encountered a fatal error."}}';
                        }

                        let fullResponse = JSON.stringify({
                            for : request,              // the type of request the API is replying to
                            response : serverResponse   // the API's response
                        });

                        if (sendToUsers !== null) {     // send response to multiple users
                            server.clients.forEach((otherWS) => {
                                /* Check if the source domains match, if the user on this WebSocket
                                is on the list of users and in the case the data is limited to
                                users who have the current item open check if the user currently
                                has this item open. */ 
                                if (otherWS.source === ws.source &&
                                    sendToUsers.indexOf(otherWS.userID) != -1 &&
                                    (openItemID === -1 ||
                                    openItemID !== -1 && otherWS.openItemID === openItemID)) {
                                    otherWS.send(btoa(fullResponse));
                                }
                            });
                        } else {    // send response only to the original client
                            ws.send(btoa(fullResponse));    // send the full response to the client
                        }

                    });
                    break;
                }
            }
        } else {    // handle registrations
            let fullResponse = null;

            // check if the client's source domain is in the list of valid domains
            if (validDomains.indexOf(clientRequest.data.source) !== -1) {
                if (clientRequest.data.source === ws.originalSource) {
                    // if the original and advertised request source match, save the client's
                    // source for later use indetifying the client
                    ws.source = ws.originalSource;
    
                    fullResponse = JSON.stringify({
                        status : "registered",
                        domain : ws.source
                    });
                } else { // this code should never run
                    logUpdate("A client switched domain, the registration request was rejected.");
                    fullResponse = JSON.stringify({
                        status : "failed",
                        reason : "Client switched domains, registration request rejected."
                    });
                }
            } else { // this code should never run either
                fullResponse = JSON.stringify({
                    status : "failed",
                    reason : ('Unknown domain "' + clientRequest.data.source + '".')
                });
            }

            ws.userID = null;
            ws.openItemID = null;

            ws.send(btoa(fullResponse));
        }
    });
    


    ws.on("pong", () => {   // called when a ping-pong response (a pong) is received
        ws.isAlive = true;
    });
    


    ws.on("close", () => {  // called upon the termination of a connection
        logUpdate("Closed a WebSocket connection with a client.");
        logUpdate("There " + ((server.clients.size !== 1) ? "are" : "is") + " currently " +
            server.clients.size + " socket" + ((server.clients.size !== 1) ? "s" : "") +
            " connected to this server.");
    });
});



/// Handle heartbeat
/**
 * Interval that sends ping-pong requests (pings) to all of the currently noted WebSocket clients
 * at 90 second intervals to verify if the connection is still alive. Clients automatically send
 * a ping-pong (a pong) response back.
 */
setInterval(function ping() {
    if (server.clients.size > 0) {
        server.clients.forEach((ws) => {
            if (!ws.isAlive) {  // if the client has already been pinged but it hasn't responded
                                // by the time we go to ping it again, terminate the connection
                ws.terminate();
                return;
            }
    
            ws.isAlive = false;
            ws.ping();  // send out a ping to the connected client
        });
    }
}, (90*1000));  // rerun the interval every 90 seconds (given in milliseconds)



/**
 * Function for logging update messages together with timestamps.
 * 
 * @param   message     Message to log.
 */
function logUpdate(message) {
    const logTime = new Date();
    console.log(logTime.toISOString() + ": " + message);
}