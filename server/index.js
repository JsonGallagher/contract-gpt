const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { OpenAI } = require("openai");
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for PDF file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Helper function to parse PDF
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file");
  }
}

// Helper function to extract relevant sections
function extractRelevantSections(text) {
  const sections = {
    propertyInfo: "",
    parties: "",
    dates: "",
    financial: "",
  };

  const lines = text.split("\n");
  let currentSection = "";

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Property address section
    if (lowerLine.includes("property") || lowerLine.includes("address")) {
      sections.propertyInfo += line + "\n";
    }

    // Parties section (buyers, sellers, agents)
    if (
      lowerLine.includes("buyer") ||
      lowerLine.includes("seller") ||
      lowerLine.includes("agent") ||
      lowerLine.includes("broker")
    ) {
      sections.parties += line + "\n";
    }

    // Dates section
    if (
      lowerLine.includes("date") ||
      lowerLine.includes("deadline") ||
      lowerLine.includes("termination") ||
      lowerLine.includes("closing")
    ) {
      sections.dates += line + "\n";
    }

    // Financial section
    if (
      lowerLine.includes("price") ||
      lowerLine.includes("loan") ||
      lowerLine.includes("mortgage") ||
      lowerLine.includes("payment")
    ) {
      sections.financial += line + "\n";
    }
  }

  // Combine relevant sections with section headers
  return `
PROPERTY INFORMATION:
${sections.propertyInfo}

PARTIES:
${sections.parties}

DATES AND DEADLINES:
${sections.dates}

FINANCIAL DETAILS:
${sections.financial}
  `.trim();
}

// Helper function to analyze text with GPT-4
async function analyzeContractWithGPT4(text) {
  try {
    // Extract only relevant sections to reduce token count
    const relevantText = extractRelevantSections(text);
    console.log("Processed text length:", relevantText.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a real estate contract analyzer. Extract key information from the given text. 
                   Only include information that you find in the text - use null for missing fields.
                   Return a JSON object with the following structure exactly:
                   {
                     "propertyAddress": string or null,
                     "isFullySigned": boolean,
                     "buyerNames": string[],
                     "sellerNames": string[],
                     "purchasePrice": string or null,
                     "titleCompany": string or null,
                     "loanType": string or null,
                     "agentNames": string[],
                     "deadlines": {
                       "inspectionTermination": string or null,
                       "inspectionObjection": string or null,
                       "inspectionResolution": string or null,
                       "appraisalDeadline": string or null,
                       "appraisalObjection": string or null,
                       "appraisalResolution": string or null,
                       "loanTerms": string or null,
                       "loanAvailability": string or null,
                       "closingDate": string or null,
                       "possessionDate": string or null
                     }
                   }`,
        },
        {
          role: "user",
          content: relevantText,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    // Parse the response
    const analysisResult = JSON.parse(response.choices[0].message.content);
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing with GPT-4:", error);
    throw new Error("Failed to analyze contract content");
  }
}

// API endpoint for contract analysis
app.post("/api/analyze", upload.single("contract"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse the PDF
    const text = await parsePDF(req.file.buffer);
    console.log("Extracted text length:", text.length);

    // Analyze with GPT-4
    const analysis = await analyzeContractWithGPT4(text);

    res.json(analysis);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    message: error.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
