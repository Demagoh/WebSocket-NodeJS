/// Import Node.js libraries
const pack_ws = require("ws");
const { exec } = require("node:child_process");

/// Create a WebSocket server
const server = new pack_ws.Server({port : 2096});   // this port doesn't have to be port-forwarded
                                                    // just make sure that access to it is allowed
                                                    // in your server's firewall if you want to
                                                    // connect from another machine
console.log("Running on port 2096.");

/// Specify valid request domains
const validDomains = [ // <-- specify your domains here!!!
    "localhost"
]

/// Handle connection events
server.on("connection", (ws) => {
    ws.isAlive = true;      // used to track whether this WebSocket instance is still open

    console.log("Opened a new WebSocket connection with a client.")
    console.log("There " + ((server.clients.size != 1) ? "are" : "is") + " currently " + 
        server.clients.size + " socket" + ((server.clients.size != 1) ? "s" : "") +
        " running on this server.");

    ws.on("message", (message) => {
        let clientRequest = JSON.parse(atob(message.toString()));   // request object we received
        if (clientRequest.type !== "registration") {
            let request = clientRequest.data.request;   // store the request for later
            if (ws.source === "localhost") { // <-- specify your domain here!!!
                // prepare and "mask" the contents of the request (to prevent injection attempts)
                let APIRequest = "php api.php " +
                    btoa(JSON.stringify(clientRequest.data));
                
                // forward the request to the API
                exec(APIRequest, (error, stdout, stderror) => {
                    if (!error && !stderror) {
                        let serverResponse = stdout;
                        let fullResponse = JSON.stringify({
                            for : request,              // the type of request the client sent
                            response : serverResponse   // the API response
                        });
                        
                        ws.send(btoa(fullResponse));    // forward the API response to the client
                    }
                });
            }
        } else {
            let fullResponse = null;

            if (validDomains.indexOf(clientRequest.data.source) != -1) {
                ws.source = clientRequest.data.source;      // track which domain this client is connected to

                fullResponse = JSON.stringify({
                    status : "registered",
                    domain : ws.source
                });
            } else {
                fullResponse = JSON.stringify({
                    status : "failed",
                    reason : ('Unknown domain "' + clientRequest.data.source + '".')
                });
            }

            ws.send(btoa(fullResponse));
        }
    });
    
    ws.on("pong", () => {
        ws.isAlive = true;
    });
    
    ws.on("close", () => {
        console.log("Closed a WebSocket connection with a client.")
        console.log("There " + ((server.clients.size != 1) ? "are" : "is") + " currently " +
            server.clients.size + " socket" + ((server.clients.size != 1) ? "s" : "") +
            " running on this server.");
    });
});


/// Handle 
/**
 * Interval that pings all the currently noted WebSocket clients periodically to see if
 * the connection is still alive. Clients automatically send a pong back.
 */
setInterval(function ping() {
    if (server.clients.size > 0) {  // only send out pings when we are connected to clients
        server.clients.forEach((ws) => {
            if (!ws.isAlive) {      // if the client has already been pinged but it hasn't ponged
                                    // us back yet, we terminate the connection
                ws.terminate();
                return;
            }
    
            ws.isAlive = false;
            ws.ping();              // send out a ping to the connected client
        });
    }
}, (90*1000));  // rerun the interval every 90,000 ms