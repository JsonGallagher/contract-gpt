const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
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

// Helper function to format dates to YYYY-MM-DD
function formatDateToISO(dateStr) {
  if (!dateStr) return null;

  // Handle MM/DD/YYYY format
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle YYYY-MM-DD format (already correct)
  if (dateStr.includes("-")) {
    return dateStr;
  }

  // Handle other formats (e.g., DD-MM-YYYY)
  if (dateStr.includes("-") && dateStr.split("-")[2].length === 4) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // If the format is unrecognized, return null
  return null;
}

// Helper function to extract relevant sections with better context
function extractRelevantSections(text) {
  const sections = {
    identification: [],
    propertyInfo: [],
    parties: [],
    dates: [],
    financial: [],
    purchase: [],
    loan: [],
    closing: [],
  };

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentSection = "";
  let inSection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Track major sections
    if (lowerLine.includes("1. agreement")) {
      currentSection = "identification";
      inSection = true;
    } else if (lowerLine.includes("2. parties and property")) {
      currentSection = "parties";
      inSection = true;
    } else if (lowerLine.includes("3. dates, deadlines")) {
      currentSection = "dates";
      inSection = true;
    } else if (lowerLine.includes("4. purchase price")) {
      currentSection = "purchase";
      inSection = true;
    } else if (
      lowerLine.includes("loan") &&
      lowerLine.includes("limitations")
    ) {
      currentSection = "loan";
      inSection = true;
    } else if (lowerLine.includes("12. closing")) {
      currentSection = "closing";
      inSection = true;
    }

    // Look specifically for property address
    if (lowerLine.includes("known as:")) {
      const addressLine = line + "\n";
      // Include the next few lines to ensure we get the full address
      const nextIndex = lines.indexOf(line);
      if (nextIndex >= 0 && nextIndex + 1 < lines.length) {
        sections.propertyInfo.push(addressLine);
        sections.propertyInfo.push(lines[nextIndex + 1]);
      }
    }

    // Store lines in appropriate sections
    if (inSection) {
      switch (currentSection) {
        case "identification":
          sections.identification.push(line);
          break;
        case "parties":
          sections.propertyInfo.push(line);
          sections.parties.push(line);
          break;
        case "dates":
          sections.dates.push(line);
          break;
        case "purchase":
          sections.purchase.push(line);
          sections.financial.push(line);
          break;
        case "loan":
          sections.loan.push(line);
          break;
        case "closing":
          sections.closing.push(line);
          break;
        default:
          console.warn(`Unknown section encountered: ${currentSection}`);
          break;
      }
    }

    // Capture additional context
    if (
      lowerLine.includes("price") ||
      lowerLine.includes("payment") ||
      lowerLine.includes("earnest money") ||
      lowerLine.includes("loan amount")
    ) {
      sections.financial.push(line);
    }
  }

  // Format the extracted sections for the AI
  return `
PROPERTY AND PARTIES INFORMATION:
${sections.propertyInfo.join("\n")}

IDENTIFICATION:
${sections.identification.join("\n")}

FINANCIAL DETAILS:
${sections.financial.join("\n")}

DATES AND DEADLINES:
${sections.dates.join("\n")}

LOAN INFORMATION:
${sections.loan.join("\n")}

CLOSING DETAILS:
${sections.closing.join("\n")}
  `.trim();
}

// Helper function to analyze contract with AI
async function analyzeContractWithAI(text) {
  try {
    const relevantText = extractRelevantSections(text);
    console.log("Processing text length:", relevantText.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Colorado real estate contract analyzer. Your task is to extract information from the contract and return it as a JSON object. Do not include any markdown formatting, explanation text, or backticks in your response. Only return the raw JSON object.

The propertyAddress MUST be extracted from section 2.4 of the contract. Look for the text that comes after "known as:" and before "together with". This is the complete property address.

For example, in the contract text if you see:
"2.4. Property. The Property is ... known as: 123 Main Street, City, CO 12345"
Then the propertyAddress should be "123 Main Street, City, CO 12345"

Additional extraction rules:
- propertyAddress: Find this EXACTLY as written after "known as:" in section 2.4
- Purchase Price: Extract from section 4.1, including the dollar sign
- Loan Type: Look for checked boxes in section 4.5.3
- Deadlines: All dates must be in YYYY-MM-DD format

For each field, I'll tell you exactly where to look:

1. Property Address: Find the complete property address in section 2.4 (look for "known as:" followed by the address)
2. Buyer Names: Section 2.1 lists the buyers
3. Seller Names: Section 2.3 lists the sellers
4. Purchase Price: Section 4.1 shows the total purchase price
5. Title Company: Look for title company name in sections about closing or earnest money
6. Loan Type: Section 4.5.3 has checkboxes for Conventional, FHA, VA, etc.
7. Agent Names: Find all broker/agent names at the end of the contract
8. Deadlines: Section 3.1 lists all key dates - convert them to YYYY-MM-DD format

IMPORTANT: For deadlines, ensure the following mappings:
- Inspection Termination: Extract from "§ 10 Inspection Termination Deadline" (e.g., "1/31/2025" → "2025-01-31")
- Inspection Objection: Extract from "§ 10 Inspection Objection Deadline" (e.g., "1/31/2025" → "2025-01-31")
- Inspection Resolution: Extract from "§ 10 Inspection Resolution Deadline" (e.g., "2/3/2025" → "2025-02-03")
- Appraisal Deadline: Extract from "§ 6 Appraisal Deadline" (e.g., "1/30/2025" → "2025-01-30")
- Appraisal Objection: Extract from "§ 6 Appraisal Objection Deadline" (e.g., "1/31/2025" → "2025-01-31")
- Appraisal Resolution: Extract from "§ 6 Appraisal Resolution Deadline" (e.g., "2/3/2025" → "2025-02-03")
- Loan Terms: Extract from "§ 5 New Loan Terms Deadline" (e.g., "1/24/2025" → "2025-01-24")
- Loan Availability: Extract from "§ 5 New Loan Availability Deadline" (e.g., "2/3/2025" → "2025-02-03")
- Closing Date: Extract from "§ 12 Closing Date" (e.g., "2/11/2025" → "2025-02-11")
- Possession Date: Extract from "§ 17 Possession Date" (e.g., "2/11/2025" → "2025-02-11")

Return a JSON object with exactly this structure, using precise data from the contract:
{
  "propertyAddress": "full address as string",
  "isFullySigned": boolean,
  "buyerNames": ["array of names"],
  "sellerNames": ["array of names"],
  "purchasePrice": "exact amount with dollar sign",
  "titleCompany": "company name",
  "loanType": "type checked in 4.5.3",
  "agentNames": ["array of agent names"],
  "deadlines": {
    "inspectionTermination": "YYYY-MM-DD",
    "inspectionObjection": "YYYY-MM-DD",
    "inspectionResolution": "YYYY-MM-DD",
    "appraisalDeadline": "YYYY-MM-DD",
    "appraisalObjection": "YYYY-MM-DD",
    "appraisalResolution": "YYYY-MM-DD",
    "loanTerms": "YYYY-MM-DD",
    "loanAvailability": "YYYY-MM-DD",
    "closingDate": "YYYY-MM-DD",
    "possessionDate": "YYYY-MM-DD"
  }
}`,
        },
        {
          role: "user",
          content: `Extract the contract information according to the specified structure. Here's the contract text:

${relevantText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    // Clean the response text
    let content = response.choices[0].message.content.trim();
    if (content.startsWith("```json")) {
      content = content.substring(7);
    }
    if (content.startsWith("```")) {
      content = content.substring(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.replace(/`/g, "").trim();

    // Parse the JSON
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON Parse Error. Content:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Format all dates in the analysis result
    analysisResult.deadlines = {
      inspectionTermination: formatDateToISO(
        analysisResult.deadlines.inspectionTermination
      ),
      inspectionObjection: formatDateToISO(
        analysisResult.deadlines.inspectionObjection
      ),
      inspectionResolution: formatDateToISO(
        analysisResult.deadlines.inspectionResolution
      ),
      appraisalDeadline: formatDateToISO(
        analysisResult.deadlines.appraisalDeadline
      ),
      appraisalObjection: formatDateToISO(
        analysisResult.deadlines.appraisalObjection
      ),
      appraisalResolution: formatDateToISO(
        analysisResult.deadlines.appraisalResolution
      ),
      loanTerms: formatDateToISO(analysisResult.deadlines.loanTerms),
      loanAvailability: formatDateToISO(
        analysisResult.deadlines.loanAvailability
      ),
      closingDate: formatDateToISO(analysisResult.deadlines.closingDate),
      possessionDate: formatDateToISO(analysisResult.deadlines.possessionDate),
    };

    // Log the extracted analysis result
    console.log(
      "Extracted Analysis Result:",
      JSON.stringify(analysisResult, null, 2)
    );

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing with AI:", error);
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

    // Analyze with AI
    const analysis = await analyzeContractWithAI(text);

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
