import React, { useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

const ContractAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    try {
      setError(null);
      const file = event.target.files[0];

      if (!file) return;

      if (!file.type.includes("pdf")) {
        throw new Error("Please upload a PDF file");
      }

      setFile(file);
      setLoading(true);

      // Create form data for file upload
      const formData = new FormData();
      formData.append("contract", file);

      // Send to backend
      const response = await fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze contract");
      }

      const analysisData = await response.json();
      setAnalysis(analysisData);
    } catch (err) {
      console.error("Error processing contract:", err);
      setError(err.message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Contract Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Upload a contract to extract key information
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="max-w-xl mx-auto">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <span className="text-gray-600">
                  {file
                    ? file.name
                    : "Drop your contract here or click to upload"}
                </span>
                <p className="text-sm text-gray-500 mt-1">PDF files only</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mt-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing contract...</p>
          </div>
        )}

        {/* Results Section */}
        {analysis && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-500" />
              Analysis Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Main Information */}
              <div className="space-y-6">
                <InfoField
                  label="Property Address"
                  value={analysis.propertyAddress}
                />
                <InfoField
                  label="Contract Status"
                  value={
                    analysis.isFullySigned
                      ? "Fully Signed"
                      : "Pending Signatures"
                  }
                  alert={!analysis.isFullySigned}
                />
                <InfoField
                  label="Buyer Names"
                  value={analysis.buyerNames.join(", ")}
                />
                <InfoField
                  label="Seller Names"
                  value={analysis.sellerNames.join(", ")}
                />
                <InfoField
                  label="Purchase Price"
                  value={analysis.purchasePrice}
                />
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <InfoField
                  label="Title Company"
                  value={analysis.titleCompany}
                />
                <InfoField label="Loan Type" value={analysis.loanType} />
                <InfoField
                  label="Agent Names"
                  value={analysis.agentNames.join(", ")}
                />
              </div>
            </div>

            {/* Deadlines Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Key Deadlines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.deadlines).map(([key, value]) => (
                  <DeadlineItem
                    key={key}
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                    date={value}
                  />
                ))}
              </div>
            </div>

            {!analysis.isFullySigned && (
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Action Required
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This contract appears to be missing signatures. Please
                      check for counterproposals.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoField = ({ label, value, alert }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-500">{label}</label>
    <div
      className={`text-lg ${
        alert ? "text-red-600 font-medium" : "text-gray-900"
      }`}
    >
      {value || "Not specified"}
    </div>
  </div>
);

const DeadlineItem = ({ label, date }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    <div className="text-gray-900">{date || "Not specified"}</div>
  </div>
);

export default ContractAnalyzer;
