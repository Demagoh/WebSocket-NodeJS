/// Calculating delay before next connection attempt
let baseDelay = 500;            // base delay duration in milliseconds
let maximumDelay = 30000;       // maximum delay duration in milliseconds
let jitterDelayDuration = true; // whether or not to add "noise" to the output of the function

function delayBeforeRetry() {
    let attemptsSoFar = 0;
    
    // return an object
    return {
        nextDelay() {
            // make the new delay double the previous delay, up to the maximum delay duration
            const newDelay = Math.min(baseDelay * Math.pow(2, attemptsSoFar), maximumDelay);
            
            attemptsSoFar++;
            
            if (jitterDelayDuration) { // apply jitter to the delay duration
                return Math.floor(newDelay * (Math.random()*0.25 + 0.75));
            } else {
                return newDelay;
            }
        },
        resetCounter() {
            attemptsSoFar = 0;  // used to reset the counter once the WebSocket is reconnected
        }
    };
}



/// WebSocket connection manager class
export class WebSocketManager {
    connect() {
        /// Attempt to connect to WebSocket server
        this.socket = new WebSocket(this.serverURL);
        this.runOnConnectionUpdate?.("connecting");
        
        console.info("Connecting to WebSocket server...");

        /// Handle the socket's connection
        this.socket.addEventListener("open", () => {
            this.delayGenerator.resetCounter();
            this.retriesSoFar = 0;
            this.runOnConnectionUpdate("connected");

            console.info("Connected to WebSocket server.");
        });

        this.socket.addEventListener("close", (e) => {
            if (e.code === 1000) {
                return;
            }

            console.info("Connection to WebSocket server died.");

            this.attemptToReconnect();      // begin attempting to reconnect
        });

        this.socket.addEventListener("message", (message) => {
            this.runOnMessage(message);    // run function for hanndling messages
        });
    }

    attemptToReconnect() {
        if (this.retriesSoFar >= this.maximumNumberOfRetries) {
            console.info("Failed to reconnect, abandoning.");
            this.runOnConnectionUpdate?.("disconnected");
            return;
        }

        let delayUntilNextRetry = this.delayGenerator.nextDelay();

        console.info("Attempting to reconnect to WebSocket server after a disconnect in "
            + Math.round(delayUntilNextRetry/10)/100 + "s.");

        this.retriesSoFar++;
        this.runOnConnectionUpdate?.("reconnecting");

        setTimeout(() => this.connect(), delayUntilNextRetry);
    }

    sendMessage(message) {
        let request = {
            source : window.location.hostname,
            data : message
        }
        
        request = JSON.stringify(request);
        request = btoa(request);

        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(request);
        } else {
            console.warn("No connection to WebSocket server, message failed to send.");
        }
    }

    constructor(WebSocketServerURL, runOnMessage, runOnConnectionUpdate) {
        /// Set the object's attributes
        this.serverURL = WebSocketServerURL;

        this.runOnMessage = runOnMessage;                       // function to handle messages
        this.runOnConnectionUpdate = runOnConnectionUpdate;     // function to handle updates

        this.delayGenerator = delayBeforeRetry();               // get the functions's object
        this.maximumNumberOfRetries = 10;                       // basically when we give up
        this.retriesSoFar = 0;                                  // how many times we've tried

        /// Attempt to connect to the WebSocket server using the object's connect() method
        this.connect();
    }
}