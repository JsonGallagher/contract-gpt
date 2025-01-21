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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Contract Analyzer
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Upload a contract to extract key information
          </p>
        </div>

        {/* Upload Box */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block text-center"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <span className="block text-gray-800 text-lg mb-2">
              {file ? file.name : "Drop your contract here or click to upload"}
            </span>
            <span className="text-sm text-gray-500">PDF files only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ContractAnalyzer;
