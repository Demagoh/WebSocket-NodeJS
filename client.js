/// WebSocket
import {AppInfo} from "./publicInfo.js";
import {WebSocketManager} from "./WebSocketManager.js";

let serverConnection = null;

console.info("Loading page...");

window.onload = () => {
    console.info("Page loaded.");

    serverConnection = new WebSocketManager(
        "wss://" + AppInfo.WebSocketServer + "/",
        handleServerResponse,
        handleUpdate
    );
}

function handleUpdate(status, reconnectionAttempts = 0) {
    switch (status) {
        case "registered":
            requestServer({
                request : "echo",
                data : {
                    text : "test"
                }
            });
            break;
    }
}



/// Communication handling
/**
 * Function for sending request data to the API.
 */
function requestServer(data) {
    serverConnection.sendMessage(data);
}

/**
 * Function for handling API responses.
 */
function handleServerResponse(message) {
    let fullResponse = JSON.parse(atob(message.data));
    let serverResponse = JSON.parse(fullResponse.response);

    switch(fullResponse.for) {
        case "echo":
            console.log(serverResponse.response.text);
            break;
        default:
            console.log(serverResponse);
    }
}