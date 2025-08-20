import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { getPlaybooks } from "./functions/getPlaybooks.js";
import { getSystemPromptFunctions } from "./functions/getSystemPromptFunctions.js";
import { getPlaybook } from "./functions/getPlaybook.js";
import { getTalentIqDictionaryToc } from "./functions/getTalentIqDictionaryToc.js";
import { getTalentIqDictionarySection } from "./functions/getTalentIqDictionarySection.js";
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

// Function call proxy route
app.post("/get_talentiq_dictionary_toc", async (req, res) => {
  try {
    const toc = await getTalentIqDictionaryToc();
    res.json(toc);
  } catch (error) {
    console.error(
      "Error fetching function call get_talentiq_dictionary_toc:",
      error,
    );
    res.status(500).json({
      error: "Failed to fetch function call get_talentiq_dictionary_toc",
    });
  }
});

// Function call proxy route
app.post("/get_talentiq_dictionary_section", async (req, res) => {
  const { section_id } = req.body || {};
  if (!section_id) {
    return res.status(400).json({ error: "Section ID is required" });
  }
  try {
    const section = await getTalentIqDictionarySection(section_id);
    res.json(section);
  } catch (error) {
    console.error(
      "Error fetching function call get_talentiq_dictionary_section:",
      error,
    );
    res.status(500).json({
      error: "Failed to fetch function call get_talentiq_dictionary_section",
    });
  }
});

app.get("/sys_prompt_functions", async (req, res) => {
  const sysPromptFunctions = (await getSystemPromptFunctions()) || {
    system_prompt: "",
  };

  res.json(sysPromptFunctions);
});

app.get("/playbooks", async (req, res) => {
  const playbooks = await getPlaybooks();
  res.json(playbooks);
});

app.get("/playbook/:id", async (req, res) => {
  const playbookId = req.params.id;
  if (!playbookId)
    return res.status(400).json({ error: "Playbook ID is required" });

  const playbook = await getPlaybook(playbookId);
  res.json(playbook);
});

// API route for token generation
app.get("/token", async (req, res) => {
  const response = await axios
    .post(
      "https://api.openai.com/v1/realtime/sessions",
      {
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "verse",
        instructions: "Follow the Agent Instructions in your System Prompt.",
        modalities: ["audio", "text"],
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
