"use strict";

// Port where the websocket server will listen to
var webSocketsServerPort = 8080;
// Websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

// Create empty array for latest 100 messages
var history = [];
// Create empty array for connected clients (users)
var clients = [];

/**
 * Helper function for escaping input strings. No clue what this does. But it was in the tutorial.
 * Used to create html string entities to later be broadcasted.t
 */
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with colors...
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server.
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server and not HTTP server.
    console.log("Still a log to see if it works!");
});
// Server listenes to above defined port 8080 (Could be 8080 as well) and prints the Date as well as the Port to console
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port "
        + webSocketsServerPort);
});

/**
 * WebSocket server. Not sure wy the httpServer is used. Looked it up in the tutorial.
 */
var wsServer = new webSocketServer({
    httpServer: server
});

// The below callback function is called every time a user connects to the server. Every other function like onmessage
// and onclose is incorperated into it.
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin '
        + request.origin + '.');

    // If user connects to the server, you can check on 'request.origin' to make sure if he actually is connected.
    // Also taken from the tutorial. Just saying.
    var connection = request.accept(null, request.origin);

    // We need to know the user index in order to remove them from the array on close event. So we create an 'index' and
    // push the accepted connections to the 'clients' array.
    var index = clients.push(connection);
    var userName = false;
    var userColor = false;
    console.log((new Date()) + ' Connection accepted.');

    // Send the chat history. The history is firstly converted into a JSON string using JSON.stringyfy() where
    // the variable 'type' has the value of 'history'. Same with data.
    if (history.length > 0) {
        connection.sendUTF(
            JSON.stringify({ type: 'history', data: history} ));
    }

    // User sent us a message. Awe!
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // Accept only text
            // First message sent by user is actually their name
            if (userName === false) {
                // Remember the user name
                userName = htmlEntities(message.utf8Data);
                // Get a random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(
                    JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                    + ' with ' + userColor + ' color.');
            }
            else {
                // Log the message and user
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);
                // Keep history of all messages!!
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);
                // Broadcast the message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });
    // User disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // Remove user from the list of connected clients
            clients.splice(index, 1);
            // Push colors
            colors.push(userColor);
        }
    });
});