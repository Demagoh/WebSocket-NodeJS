# WebSocket-NodeJS
**WebSocket-NodeJS** is a compilation of scripts written in JavaScript and PHP which implement an echo API using the WebSocket protocol, with support for accessing mulitple application's APIs through a single WebSocket server.

## Functionality
These scripts (when integrated into an application correctly) implement a system for a client and an API (written in PHP) to communicate with each other using the WebSocket protocol.<br />
A single WebSocket server can handle requests from multiple web applications at the same time, because it uses the client's source domain name as criteria by which it chooses which application's API to use.

## License
This repository is licensed under the <a href="LICENSE" target="_blank">MIT license</a>.

## How to contribute to the project
Just fork it, I'm not going to deal with pull requests.

## How to use it
To integrate (or build upon) this project, you'll need to:
- install a PHP CLI interpreter (which on Linux should come with your PHP package)
- install Node.js<br />
  *for Debian*:
  ```
  $ sudo apt-get install nodejs
  ```
- install the ``ws`` package for Node.js
  ```
  $ npm install ws
  ```
- modify the ``privateInfo.js`` and ``publicInfo.js`` scripts to contain the correct domain name (by default they just have placeholders)
- modify the ``server.js`` script to import the ``privateInfo.js`` script, as well as list it as an app in the **apps** array
- include the <a href="client.js">client.js</a> script as a module in the HTML ``<head>`` element of your web apps site:
  ```
  <script type="module" src="client.js" defer></script>
  ```
- enable forwarding of WebSocket requests in **nginx**, if you are using a different web server look into what you have to do (if you even have to do anything) to make sure that WebSocket requests reach the WebSocket server.
  - I have provided an <a href="nginxWebSocketServerForwarder">example of an nginx configuration</a> which defines both the **upstream** and **server** directives needed for a ***ws*** connection (the <a href="client.js">client.js</a> script uses **wss** by default, so either make it use **ws** or provide an SSL certificate for **wss**).

<br />

The following scripts are to be used on the **client**:
- <a href="client.js">client.js</a>
- <a href="publicInfo.js">publicInfo.js</a>
- <a href="WebSocketManager.js">WebSocketManager.js</a>

<br />

The following scripts are to be used on the **server** and ***should not*** be accessible from the client:
- <a href="server.js">server.js</a>
- <a href="privateInfo.js">privateInfo.js</a>

<br />

To start the WebSocket server you just have to run:
```
$ node server.js
```

I also recommend you use <a href="https://www.npmjs.com/package/pm2">PM2</a> to automatically restart the WebSocket server when it crashes and to automatically start it upon system startup.