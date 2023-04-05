/** @format */

var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto"); 

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log("middleware");
  req.testing = "testing";
  return next();
});

// INDEX IF YOU CALL IT WITHOUT WEB SOCKET LIKE INDEX.HTML
app.get("/", (req, res, next) => {
  res.json({ key: GenerateKey() });
});

const clients = [];

// Create a connexion between the
app.ws("/:key", function (ws, req) {
  const key = req.params.key;
  clients[key] = ws;
  console.log(clients);
  console.log("socket", req.testing);

  ws.on("close", function () {
    console.log(`Client with key ${key} disconnected.`);
    delete clients[key];
  });

  ws.on("error", function (err) {
    console.error(`WebSocket error for client with key ${key}:`, err);
    delete clients[key];
  });
});

app.post("/api/send-message/:key", async function (req, res) {
  const { message } = req.body;
  const key = req.params.key;

  if (!clients[key]) {
    return res.status(404).json({ success: false, error: "Client not found" });
  }

  if (clients[key].readyState !== 1) {
    console.error(`WebSocket is not open for client with key ${key}`);
    delete clients[key];
    return res.status(500).json({ success: false, error: "WebSocket is not open" });
  }

  try {
    await sendMessageToClient(clients[key], message);
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to send message to client with key ${key}:`, error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

const sendMessageToClient = (client, message) => {
  return new Promise((resolve, reject) => {
    client.send(message, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const GenerateKey = () => {
  // return `${getrandomInt(999999999)}${getrandomInt(999999999)}${getrandomInt(999999999)}`;
  return crypto.randomBytes(16).toString("hex");
};

const port = process.argv[2] || 8000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// app.listen(8000, () => {
//   console.log("Server is listening on port 8000");
// });
// const getrandomInt = (max) => {
//   return Math.floor(Math.random() * Math.floor(max));
// };


// React.useEffect(() => {
//   const socket = new WebSocket("ws://localhost:8000");

//   socket.addEventListener("message", function (event) {
//     const message = event.data;
//     setMessages([...messages, message]);
//   });

//   return () => {
//     socket.close();
//   };
// }, [messages]);
