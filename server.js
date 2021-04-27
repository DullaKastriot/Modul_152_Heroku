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
 * Helper function for escaping input strings. In other words, this functions actually makes it happen, so that
 * special characters can be used in the chat without causing any damage whatsoever.
 */
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Array with colors...
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function (a, b) { return Math.random() > 0.5; });
/**
 * Creates http server. This one will be the server on which the websocket Server will be running.
 */
var server = http.createServer(function (request, response) {
    console.log("The http server is done.");
});
// Server listenes to above defined port 8080 (Could be other port as well) and prints the Date as well as the Port to
// console when firstly connected.
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port "
        + webSocketsServerPort);
});
/**
 * WebSocket server. This bad boy upgrades the http server to a websocket server. It is not ment to handle requests of
 * any kind (and it won't!). So this is purely an upgrate to the http protocol. Websocket on it's own cannot serve any
 * kind of data.
 */
var wsServer = new webSocketServer({
    httpServer: server
});
// The below callback function is called every time a user connects to the server. The first part actually logs the
// request origin. In or case it is mostly going to be http://localhost:63342 or something similar.
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin '
        + request.origin + '.');
    // Accept the connection when the user is connected to the server.
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
        connection.sendUTF(JSON.stringify({ type: 'history', data: history }));
    }
    // User sent us a message. Awe!
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // Accept only text
            // First message sent by user is actually their name
            if (userName === false) {
                // Remember the user name
                userName = htmlEntities(message.utf8Data);
                // Get a random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type: 'color', data: userColor }));
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
                var json = JSON.stringify({ type: 'message', data: obj });
                for (var i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });
    // User disconnected
    connection.on('close', function (connection) {
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
//# sourceMappingURL=server.js.map