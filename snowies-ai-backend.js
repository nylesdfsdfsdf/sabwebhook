import express from "express";
import "dotenv/config";

const app = express();
app.use(express.json({ limit: "20kb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const SYSTEM_PROMPT = `
You are Snowies AI Helper inside a Roblox admin panel.

Keep answers short, simple, and easy to understand.

You can help explain:
- whitelist times like 1m, 1h, 1d, and 1w
- blank whitelist time means permanent
- Owner, Co-Owner, Admin, and Whitelisted roles
- Admins can whitelist players for 1 hour
- whitelisted/admin players are protected from teleporting
- Themes and GUI size settings
- how the Roblox admin panel works

Do not claim you performed Roblox actions yourself.
`;

app.post("/ask", async (req, res) => {
  try {
    const question =
      typeof req.body?.question === "string"
        ? req.body.question.trim().slice(0, 1000)
        : "";

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions: SYSTEM_PROMPT,
          input: question,
          max_output_tokens: 350
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(502).json({
        success: false,
        message: "OpenAI request failed."
      });
    }

    let answer = "";

    for (const item of data.output ?? []) {
      for (const content of item.content ?? []) {
        if (
          content.type === "output_text" &&
          typeof content.text === "string"
        ) {
          answer += content.text;
        }
      }
    }

    answer = answer.trim();

    return res.json({
      success: true,
      answer: answer || "No response."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(
    `Snowies AI Helper backend running on port ${port}`
  );
});
