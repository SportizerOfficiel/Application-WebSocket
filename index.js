/** @format */

var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

app.use(function (req, res, next) {
  console.log("middleware");
  req.testing = "testing";
  return next();
});

// INDEX IF YOU CALL IT WITHOUT WEB SOCKET LIKE INDEX.HTML
app.get("/", function (req, res, next) {
  res.json({ key: GenerateKey() });
});

const clients = [];

// Create a connexion between the
app.ws("/:key", function (ws, req) {
  const key = req.params.key;
  clients[key] = ws;
  console.log(clients);
  console.log("socket", req.testing);
});

app.post("/api/send-message/:key", function (req, res) {
  const { message } = req.body;
  const key = req.params.key;
  clients[key].send(message);
  res.json({ success: true });
});

const getrandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};
const GenerateKey = () => {
  return `${getrandomInt(999999999)}${getrandomInt(999999999)}${getrandomInt(999999999)}`;
};

app.listen(8000);

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
