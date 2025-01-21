import React from "react";

const TestComponent = () => {
  return (
    <div className="p-4">
      <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold">Test Component</h2>
        <p className="mt-2">
          If you see this with blue background and white text, Tailwind is
          working!
        </p>
      </div>
    </div>
  );
};

export default TestComponent;
