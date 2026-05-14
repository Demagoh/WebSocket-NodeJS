# WebSocket-NodeJS
**WebSocket-NodeJS** is a bundle of scripts written in JavaScript and PHP, which implement an API using the WebSocket protocol.

## Functionality
Using this bundle you can connect to a WebSocket server running in Node.js from a browser client. You can use a single WebSocket server for accessing multiple different APIs, based on which domain the requests are coming into the server from.

## License
This repository is licensed under the <a href="LICENSE" target="_blank">MIT license</a>.

## Contributing
Just fork it, I'm not going to deal with pull requests.

## How to use it
### Setting up the demo project
To set up the project in its demo form (AKA what you get in this repository), you'll need a PHP CLI interpreter (which should come with your standard PHP packages on Linux).<br />
You will also need to:
- install Node.js on your system<br />
  On Debian:
  ```
  $ sudo apt-get install nodejs
  ```
- install the ``ws`` package
  ```
  $ npm install ws
  ```
- if for some reason it doesn't come with Node.js, install the ``child_process`` package

Once you have everything installed, start the WebSocket server:
```
$ node server.js
```

Then, open <a href="index.html">index.html</a> in your browser and check the console (to open it, press the F12 key) and see if you get a ``test`` message.<br />
<br />

### Adding to existing websites
Include the <a href="client.js">client.js</a> script as a module in the HTML ``<head>`` element:
```
<script type="module" src="script.js" defer></script>
```
You can also just include the <a href="WebSocketManager.js">WebSocketManager.js</a> script in an already existing **client** script, just make sure to then include the **client** as a module, not a normal script.<br />

Modify the <a href="server.js">server.js</a> script to point to the appropriate API script (or rewrite it to handle the API by itself).<br />

Run the server script just like you would for the demo (unless you changed it to the point where you have to run it differently).