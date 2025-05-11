// WelcomeScreen.jsx
import React from "react";

const WelcomeScreen = ({ onBegin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1f1f2f] to-[#0c0c1a] text-white px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-[#181818]/70 p-8 rounded-2xl shadow-lg backdrop-blur-md border border-purple-700">
        <img
          src="/Animation.gif" // use a local image or external animated GIF/PNG
          alt="AI Voqit"
          className="w-40 h-40 mx-auto mb-2 animate-pulse"
        />
        <h1 className="text-3xl font-bold">Ask anything, get answers.</h1>
        <p className="text-gray-300 text-sm">
          Using the software you can ask your questions and receive articles or images using AI assistance.
        </p>
        <button
          onClick={onBegin}
          className="w-full py-3 mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full hover:scale-105 transition-transform duration-300"
        >
          Let’s Begin →
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
