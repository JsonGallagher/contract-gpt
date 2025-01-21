import React, { useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Home,
  FileCheck,
} from "lucide-react";

const ContractAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      // Simulate analysis for now
      setLoading(true);
      setTimeout(() => {
        setAnalysis({
          propertyAddress: "123 Main St, Anytown, USA",
          isFullySigned: false,
          buyerNames: ["John Doe"],
          sellerNames: ["Jane Smith"],
          purchasePrice: "$300,000",
          titleCompany: "ABC Title",
          loanType: "Conventional",
          agentNames: ["Bob Agent", "Sally Realtor"],
          deadlines: {
            inspectionTermination: "2024-02-01",
            inspectionObjection: "2024-02-03",
            inspectionResolution: "2024-02-05",
            appraisalDeadline: "2024-02-10",
            appraisalObjection: "2024-02-12",
            appraisalResolution: "2024-02-15",
            loanTerms: "2024-02-20",
            loanAvailability: "2024-02-25",
            closingDate: "2024-03-01",
            possessionDate: "2024-03-01",
          },
        });
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing contract...</p>
          </div>
        )}

        {/* Results Section */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-500" />
              Analysis Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Main Information */}
              <div className="space-y-6">
                <InfoSection
                  icon={<Home className="h-5 w-5 text-blue-500" />}
                  label="Property Address"
                  value={analysis.propertyAddress}
                />
                <InfoSection
                  icon={<FileCheck className="h-5 w-5 text-blue-500" />}
                  label="Contract Status"
                  value={
                    analysis.isFullySigned
                      ? "Fully Signed"
                      : "Pending Signatures"
                  }
                  alert={!analysis.isFullySigned}
                />
                <InfoSection
                  icon={<Users className="h-5 w-5 text-blue-500" />}
                  label="Buyer Names"
                  value={analysis.buyerNames.join(", ")}
                />
                <InfoSection
                  icon={<Users className="h-5 w-5 text-blue-500" />}
                  label="Seller Names"
                  value={analysis.sellerNames.join(", ")}
                />
                <InfoSection
                  icon={<DollarSign className="h-5 w-5 text-blue-500" />}
                  label="Purchase Price"
                  value={analysis.purchasePrice}
                />
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <InfoSection
                  icon={<FileText className="h-5 w-5 text-blue-500" />}
                  label="Title Company"
                  value={analysis.titleCompany}
                />
                <InfoSection
                  icon={<FileText className="h-5 w-5 text-blue-500" />}
                  label="Loan Type"
                  value={analysis.loanType}
                />
                <InfoSection
                  icon={<Users className="h-5 w-5 text-blue-500" />}
                  label="Agent Names"
                  value={analysis.agentNames.join(", ")}
                />
              </div>
            </div>

            {/* Deadlines Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Key Deadlines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DeadlineItem
                  label="Inspection Termination"
                  date={analysis.deadlines.inspectionTermination}
                />
                <DeadlineItem
                  label="Inspection Objection"
                  date={analysis.deadlines.inspectionObjection}
                />
                <DeadlineItem
                  label="Inspection Resolution"
                  date={analysis.deadlines.inspectionResolution}
                />
                <DeadlineItem
                  label="Appraisal Deadline"
                  date={analysis.deadlines.appraisalDeadline}
                />
                <DeadlineItem
                  label="Appraisal Objection"
                  date={analysis.deadlines.appraisalObjection}
                />
                <DeadlineItem
                  label="Appraisal Resolution"
                  date={analysis.deadlines.appraisalResolution}
                />
                <DeadlineItem
                  label="Loan Terms"
                  date={analysis.deadlines.loanTerms}
                />
                <DeadlineItem
                  label="Loan Availability"
                  date={analysis.deadlines.loanAvailability}
                />
                <DeadlineItem
                  label="Closing Date"
                  date={analysis.deadlines.closingDate}
                />
                <DeadlineItem
                  label="Possession Date"
                  date={analysis.deadlines.possessionDate}
                />
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

const InfoSection = ({ icon, label, value, alert }) => (
  <div className="flex items-start">
    <div className="mt-1">{icon}</div>
    <div className="ml-3">
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <div
        className={`text-lg ${
          alert ? "text-red-600 font-medium" : "text-gray-900"
        }`}
      >
        {value || "Not specified"}
      </div>
    </div>
  </div>
);

const DeadlineItem = ({ label, date }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    <div className="text-gray-900">{date}</div>
  </div>
);

export default ContractAnalyzer;
