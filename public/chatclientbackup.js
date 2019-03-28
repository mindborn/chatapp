<html>
<link rel="stylesheet" type="text/css" href="chatClient.css">

<head>
  <meta charset="utf-8">
  <title>WebSockets - Simple chat</title>
  <style>
    * {
      font-family: tahoma;
      font-size: 12px;
      padding: 0px;
      margin: 0px;
    }

    p {
      line-height: 18px;
    }

    div {
      width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    #content {
      padding: 5px;
      background: #ddd;
      border-radius: 5px;
      overflow-y: scroll;
      border: 1px solid #CCC;
      margin-top: 10px;
      height: 160px;
    }

    #input {
      border-radius: 2px;
      border: 1px solid #ccc;
      margin-top: 10px;
      padding: 5px;
      width: 400px;
    }

    #status {
      width: 88px;
      display: block;
      float: left;
      margin-top: 15px;
    }
  </style>

  <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>

  <script>
    var clientid = "<%= name %>";
    //import { handleAgentLogin } from './ChatServerNew.ts';
    //var csn=new ChatServerNew();
    $(function () {
      "use strict";
      // for better performance - to avoid searching in DOM
      var content = $('#content');
      var input = $('#input');
      var status = $('#status');
      // my color assigned by the server
      var myColor = false;
      // my name sent to the server
      var myName = false;
      // if user is running mozilla then use it's built-in WebSocket
      window.WebSocket = window.WebSocket || window.MozWebSocket;
      // if browser doesn't support WebSocket, just show
      // some notification and exit
      if (!window.WebSocket) {
        content.html($('<p>',
          { text: 'Sorry, but your browser doesn\'t support WebSocket.' }
        ));
        input.hide();
        $('span').hide();
        return;
      }
      // open connection
      var connection = new WebSocket('ws://127.0.0.1:1337');
      connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose ID:');
        var decodedCookie = document.cookie;
        //let cookieval=document.cookie;
        console.log("cookie " + decodedCookie);
        let cookies = decodedCookie.split(';');
        let token = '';
        for (let i = 0; i < cookies.length; i++) {
          let c = cookies[i];
          let kv = c.split('=');
          if (kv[0] === 'token') {
            token = kv[1];
            break;
          }
        }
        console.log('found token', token);

        ///retrieve cookie
        connection.send('user');
        connection.send(token);
      };
      connection.onerror = function (error) {
        // just in there were some problems with connection...
        content.html($('<p>', {
          text: 'Sorry, but there\'s some problem with your '
            + 'connection or the server is down.'
        }));
      };
      // most important part - incoming messages
      connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server
        // always returns JSON this should work without any problem but
        // we should make sure that the massage is not chunked or
        // otherwise damaged.
        try {
          var json = JSON.parse(message.data);
        } catch (e) {
          console.log('Invalid JSON: ', message.data);
          return;
        }
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        // first response from the server with user's color
        if (json.type === 'color') {
          myColor = json.data;
          myName = json.userName;

          status.text(myName + ': ').css('color', myColor);
          input.removeAttr('disabled').focus();
          // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
          // insert every single message to the chat window
          for (var i = 0; i < json.data.length; i++) {
            addMessage(json.data[i].author, json.data[i].text,
              json.data[i].color, new Date(json.data[i].time));
          }
        } else if (json.type === 'message') { // it's a single message
          // let the user write another message
          input.removeAttr('disabled');
          addMessage(json.data.author, json.data.text,
            json.data.color, new Date(json.data.time));
        } else {
          console.log('Hmm..., I\'ve never seen JSON like this:', json);
        }
      };
      /**
       * Send message when user presses Enter key
       */
      input.keydown(function (e) {
        if (e.keyCode === 13) {
          var msg = $(this).val();
          if (!msg) {
            return;
          }
          console.log('sending message', msg);
          // send the message as an ordinary text
          connection.send(msg);
          $(this).val('');
          //disable the input field to make the user wait until server
          // sends back response
          //input.attr('disabled', 'disabled');

          // we know that the first message sent from a user their name
          // if (myName === false) {
          //   myName = msg;
          //   console.log("Client"+myName);
          // }
        }
      });
      /**
       * This method is optional. If the server wasn't able to
       * respond to the in 3 seconds then show some error message 
       * to notify the user that something is wrong.
       */
      setInterval(function () {
        if (connection.readyState !== 1) {
          status.text('Error');
          input.attr('disabled', 'disabled').val(
            'Unable to communicate with the WebSocket server.');
        }
      }, 3000);
      /**
       * Add message to the chat window
       */
      function addMessage(author, message, color, dt) {
        content.prepend('<p><span style="color:' + color + '">'
          + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
            + dt.getHours() : dt.getHours()) + ':'
          + (dt.getMinutes() < 10
            ? '0' + dt.getMinutes() : dt.getMinutes())
          + ': ' + message + '</p>');
      }
    });

  </script>
</head>

<body>
  <div id="content"></div>
  <div>
    <span id="status">Connecting...</span>
    <input type="text" id="input" />

  </div>
  <div>
    <br>

    <button class="button1" onclick="window.open('http://localhost:8888/adduserstatus')">Start</button>


    <img src="chaticon.png" width="50" height="50">
    &nbsp;
    &nbsp;
    &nbsp;
    &nbsp;
    <button class="button2" onclick="window.open('http://localhost:8888/adduserstatusclose')">
      Close
    </button>

    <img src="closechat.png" width="50" height="">


  </div>

</body>

</html>