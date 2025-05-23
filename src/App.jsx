// Enhanced Gemini-style Chat UI with modern footer and welcome screen
import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import TextareaAutosize from 'react-textarea-autosize';
import ReactMarkdown from "react-markdown";
import { FaMicrophone, FaPaperPlane, FaVolumeUp, FaMoon, FaSun, FaGithub } from "react-icons/fa";
import ShareButtons from "./components/ShareButtons";
import Lottie from "lottie-react";
import voqitAnimation from "./assets/Animation.json";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  RedirectToSignIn
} from "@clerk/clerk-react";

const cache = new Map();

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const toggleSpeaking = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim() || generatingAnswer) return;

    setGeneratingAnswer(true);

    if (cache.has(question)) {
      setChatHistory((prev) => [
        ...prev,
        { type: "question", text: question },
        { type: "answer", text: cache.get(question) },
      ]);
      setQuestion("");
      setGeneratingAnswer(false);
      return;
    }

    const apiKey = import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: question }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const fullAnswer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!fullAnswer) throw new Error("Invalid response");

      cache.set(question, fullAnswer);
      setChatHistory((prev) => [
        ...prev,
        { type: "question", text: question },
        { type: "answer", text: fullAnswer },
      ]);
      setQuestion("");
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", text: error.response?.status === 429 ? "Rate limit exceeded. Try again later." : "Error occurred. Try again." },
      ]);
    }

    setGeneratingAnswer(false);
  }


  return (
          <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <SignedOut>
        <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-[#1f1f2f] to-[#0c0c1a] text-white text-center px-6">
        <Lottie
          animationData={voqitAnimation}
          loop
          className="w-64 h-64 mb-6"
        />


          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
          Voqit Ask Anything. Get Instant Answers.
          </h1>
          <p className="text-gray-300 max-w-md mb-6 text-base sm:text-lg">
            Your personal AI assistant, powered by Gemini. Speak or type your thoughts — we’ll handle the rest.
          </p>
          <SignInButton mode="modal">
            <button className="px-8 py-3 bg-pink-600 text-white rounded-full font-medium text-lg hover:bg-pink-700 transition-transform transform hover:scale-105 shadow-md">
              Let’s Begin →
            </button>
          </SignInButton>
        </div>
      </SignedOut>



     <SignedIn>
        <header className={`p-4 shadow-sm border-b border-blue-500 ${isDarkMode ? "bg-[#111]" : "bg-white"} flex justify-between items-center`}>
          <h1 className="text-xl font-bold text-pink-500">Hello, {user?.firstName || "User"} 👋</h1>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/aarushidaksh" target="_blank" rel="noopener noreferrer" className="text-2xl text-pink-500  hover:text-pink-300">
              <FaGithub />
            </a>
            <button onClick={toggleTheme} className="text-xl">
              {isDarkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-pink-600" />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
<main className={`flex-grow overflow-y-auto px-4 pt-4 pb-32 ${isDarkMode ? "bg-[#181818]" : "bg-gray-50"}`}>
  <div className="max-w-3xl mx-auto space-y-6">
    {chatHistory.map((chat, index) => (
          <div
          key={index}
          className={`px-6 py-4 rounded-lg text-base leading-relaxed shadow-md transition-all duration-300 ${
            chat.type === "question"
              ? isDarkMode
                ? "bg-[#1a1a1a] text-white text-right"
                : "bg-pink-100 text-gray-900 text-right"
              : isDarkMode
              ? "bg-[#1e1e1e] border border-blue-500 text-white"
              : "bg-white border border-blue-500 text-gray-900"
          }`}
        >

        <ReactMarkdown
  components={{
    code({ children }) {
      return (
        <pre
          className={`rounded-md my-4 p-4 text-sm overflow-x-auto ${
            isDarkMode
              ? "bg-[#0c0c0c] text-pink-300"
              : "bg-gray-100 text-pink-800"
          }`}
          style={{ wordWrap: "break-word", whiteSpace: "pre" }}
        >
          <code className="break-words">{children}</code>
        </pre>
      );
    },
  }}
>
  {chat.text}
</ReactMarkdown>
        {chat.type === "answer" && (
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => toggleSpeaking(chat.text)} className="text-pink-500 hover:text-pink-400">
              <FaVolumeUp />
            </button>
           <ShareButtons answer={chat.text} isDarkMode={isDarkMode} />

          </div>
        )}
      </div>
    ))}

    {generatingAnswer && (
      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#1e1e1e] border border-blue-500" : "bg-white border border-blue-500"} animate-pulse`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    )}
  </div>
</main>

<form
  onSubmit={generateAnswer}
  className={`fixed bottom-0 left-0 w-full z-50 border-t ${
    isDarkMode ? "bg-[#111]/90 border-blue-500" : "bg-white/95 border-gray-300"
  }`}
>

  <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center space-x-2">
    <div className="relative flex-grow">
      <TextareaAutosize
        minRows={1}
        maxRows={6}
        required
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything..."
        className={`w-full pr-20 pl-4 py-3 rounded-2xl resize-none shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
          isDarkMode ? "bg-[#1c1c1c] text-white" : "bg-gray-100 text-gray-900" 
         
        }`}

      />

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
        {recognition && (
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full transition ${
              isListening ? "bg-red-500" : "bg-pink-500"
            } hover:scale-105 text-white`}
          >
            <FaMicrophone size={14} />
          </button>
        )}
        <button
          type="submit"
          disabled={generatingAnswer}
          className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 shadow text-white"
        >
          <FaPaperPlane size={14} className={generatingAnswer ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  </div>
</form>




      </SignedIn>
    </div>
  );
}

export default App;
