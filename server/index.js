require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3001;

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Helper function to analyze text with GPT-4
async function analyzeContractWithGPT4(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a real estate contract analyzer. Extract the following information from the contract text and return it in JSON format:
            - propertyAddress: the full property address
            - isFullySigned: boolean indicating if all required signatures are present
            - buyerNames: array of buyer names
            - sellerNames: array of seller names
            - purchasePrice: the purchase price as a formatted string
            - titleCompany: name of the title company
            - loanType: one of ["Conventional", "VA", "FHA", "Bond", "Cash"]
            - agentNames: array of agent names
            - deadlines: object containing:
              - inspectionTermination
              - inspectionObjection
              - inspectionResolution
              - appraisalDeadline
              - appraisalObjection
              - appraisalResolution
              - loanTerms
              - loanAvailability
              - closingDate
              - possessionDate`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing contract with GPT-4:", error);
    throw new Error("Failed to analyze contract");
  }
}

// Route to handle contract analysis
app.post("/api/analyze", upload.single("contract"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extract text from PDF
    const text = await extractTextFromPDF(req.file.buffer);

    // Analyze text with GPT-4
    const analysis = await analyzeContractWithGPT4(text);

    res.json(analysis);
  } catch (error) {
    console.error("Error processing contract:", error);
    res.status(500).json({ error: "Failed to process contract" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
