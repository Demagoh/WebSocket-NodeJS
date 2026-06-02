/// WebSocket
import {WebSocketManager} from "./WebSocketManager.js";

let serverConnection = new WebSocketManager("wss://localhost/", handleServerResponse, handleUpdate);

function handleUpdate(status, reconnectionAttempts = 0) {
    switch (status) {
        case "connected":
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