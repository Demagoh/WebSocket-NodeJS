<?php

/// Handle request
if ($argc != 2) {
    die('{"error":"Invalid API usage."}');
}

$APIRequest = base64_decode($argv[1]);
$APIRequestData = json_decode($APIRequest, true);

$request = $APIRequestData["request"];
$data = $APIRequestData["data"];



/// Execute based on request type
switch ($request) {
    case "echo":
        response($data);
    default:
        // handle unkown requests
        response([
            "reason" => "Unkown request: \"" .$request ."\""
        ], false);
}



/// Handle response
/**
 * Function that sends the response back to the client
 * 
 * @param   array   $response       Associative array with the data we want to send back.
 * @param   bool    $success        Flag for setting the request success status.
 * @return  null                    Doesn't return anything.   
 */
function response($response = [], $success = true) {
    $serverResponse = [
        "status" => (($success) ? "successful" : "failed"),
        "response" => $response
    ];

    die(json_encode($serverResponse));
}

?>