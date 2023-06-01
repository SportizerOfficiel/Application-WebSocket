const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  // console.log("middleware");
  req.testing = "testing";
  return next();
});

app.get("/", (req, res, next) => {
  res.json({ key: GenerateKey() });
});

const clients = {};
const generatedKeys = [];

app.ws("/:key", function (ws, req) {
  const key = req.params.key;

  if (!generatedKeys.includes(key)) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid key" }));
    ws.close();
    return;
  }

  if (clients[key]) {
    if (clients[key].length === 2) {
      ws.send(JSON.stringify({ type: "error", message: "Too many connections for this key" }));
      ws.close();
      return;
    }
    ws.send(JSON.stringify({ type: "connected" }));
    clients[key][0].send(JSON.stringify({ type: "connected" }));
    clients[key].push(ws);
    console.log(`Screen & Remote  with key ${key} Connected.`);
  } else {
    clients[key] = [ws];
    console.log(`Screen with key ${key} Connected.`);
  }


  
  ws.on("close", function () {
    console.log(`Client with key ${key} disconnected.`);
    if (clients[key]) {
      for (let client of clients[key]) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: "disconnected" }));
          client.close();
        }
      }
      delete clients[key];
      const index = generatedKeys.indexOf(key);
      if (index > -1) {
        generatedKeys.splice(index, 1);
      }
    }
  });
  

  ws.on("error", function (err) {
    console.error(`WebSocket error for client with key ${key}:`, err);
    delete clients[key];
  });
});

app.post("/api/send-message/:key", async function (req, res) {
  const { message,type } = req.body;
  const key = req.params.key;
  if (!clients[key] || !clients[key][0] || !clients[key][1]) {
    return res.status(404).json({ success: false, error: "Client not found" });
  }

  try {
    await sendMessageToClient(clients[key][0],type, message);
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to send message to client with key ${key}:`, error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

const sendMessageToClient = (client,type, message) => {
  return new Promise((resolve, reject) => {
    client.send(JSON.stringify({ type,message }), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const GenerateKey = () => {
  let key;
  do {
    key = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (generatedKeys.includes(key));

  generatedKeys.push(key);
  return key;
};

const port = process.argv[2] || 8080;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
