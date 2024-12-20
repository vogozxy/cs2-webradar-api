import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: "/webradar/socket",
  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT || 49101;

let gameData = null;

app.use(
  express.json({
    type: ["application/json", "application/x-www-form-urlencoded"],
  })
);

app.get("/webradar/sse", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/event-stream; charset=utf-8",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    "Content-Encoding": "none",
  });
  res.flushHeaders();

  const intervalId = setInterval(() => {
    res.write(`retry: 50\ndata: ${JSON.stringify(gameData)}\n\n`);
  }, 50);

  // Handle SSE client disconnection
  // If client closes connection, stop sending events
  res.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

setInterval(() => {
  io.emit("data", gameData);
}, 50);

app.post("/webradar/data", (req, res) => {
  const auth = req.get("X-Auth");
  if (auth !== process.env.SECRET) {
    return res.status(200).json({
      code: 200,
      status: "OK",
      data: {
        messages: "Player data received!",
      },
    });
  }

  try {
    const { game_data: GameData } = req.body;
    gameData = GameData || null;
  } catch (error) {
    gameData = null;
  }

  return res.status(200).json({
    code: 200,
    status: "OK",
    data: {
      messages: "Player data received!",
    },
  });
});

app.get("/webradar/data", (req, res) => {
  const auth = req.get("X-Auth");
  if (auth !== process.env.SECRET) {
    return res.status(200).json({
      code: 200,
      status: "OK",
      data: {
        messages: "Player data received!",
      },
    });
  }

  try {
    const data = req.get("X-Data");
    const { game_data: GameData } = JSON.parse(data);
    gameData = GameData || null;
  } catch (error) {
    gameData = null;
  }

  return res.status(200).json({
    code: 200,
    status: "OK",
    data: {
      messages: "Player data received!",
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  return res.status(err.status).json({
    code: err.status,
    errors: {
      message: err.message,
    },
  });
});

server.listen(PORT, () => {
  console.info(`Ready! Webradar server is listening on port ${PORT}.`);
});
