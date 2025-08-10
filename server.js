import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import axios from "axios";
// import { getPlaybooks } from "./functions/getPlaybooks.js";
// import { getPlaybook } from "./functions/getPlaybook.js";
// import { getSystemPrompt } from "./functions/getSystemPrompt.js";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// const getRandomSystemPrompt = async () => {
//   const allPlaybooks = await getPlaybooks();
//   const randomPlaybook =
//     allPlaybooks[Math.floor(Math.random() * allPlaybooks.length)];
//   console.log("Random Playbook:", randomPlaybook);
//   const sysPrompt = await getSystemPrompt(randomPlaybook);
//   console.log("Sys Prompt:", sysPrompt);
// };

// getRandomSystemPrompt();

// API route for token generation
app.get("/token", async (req, res) => {
  const response = await axios
    .post(
      "https://api.openai.com/v1/realtime/sessions",
      {
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "verse",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    )
    .then((res) => res.data)
    .catch((error) => {
      console.error("Token generation error:", error);
      res.status(500).json({ error: "Failed to generate token" });
    });

  res.json(response);
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
