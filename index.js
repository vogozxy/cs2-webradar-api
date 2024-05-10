/* eslint-disable import/extensions */

import "dotenv/config";
import express from "express";

import logger from "./logger.js";

const app = express();
const PORT = process.env.PORT || 49105;

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

app.post("/webradar/data", (req, res) => {
  const { auth, game_data: GameData } = req.body;

  if (auth !== process.env.SECRET) {
    logger.warn(
      `Someone is trying to access the API. [POST ${req.path} from ${req.ip}]`
    );

    return res.status(200).json({
      code: 200,
      status: "OK",
      data: {
        messages: "Player data received!",
      },
    });
  }

  gameData = GameData || null;

  return res.status(200).json({
    code: 200,
    status: "OK",
    data: {
      messages: "Player data received!",
    },
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);

  return res.status(err.status).json({
    code: err.status,
    errors: {
      message: err.message,
    },
  });
});

app.listen(PORT, () => {
  logger.info(`Ready! Webradar server is listening on port ${PORT}.`);
});
