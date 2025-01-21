import React, { useState } from "react";
import { Upload } from "lucide-react";

const ContractAnalyzer = () => {
  const [file, setFile] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
      </div>
    </div>
  );
};

export default ContractAnalyzer;
