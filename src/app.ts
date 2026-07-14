import "dotenv/config";
import express from "express";

const app = express();

// Lets the app read JSON request bodies.
app.use(express.json());

// Simple health check so we can confirm the server is up.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
