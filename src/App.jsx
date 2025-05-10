// Enhanced Gemini-style Chat UI with modern footer and layout refinements
import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { FaMicrophone, FaPaperPlane, FaVolumeUp, FaMoon, FaSun, FaGithub } from "react-icons/fa";
import ShareButtons from "./components/ShareButtons";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
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

    let attempts = 0;
    let delay = 2000;
    while (attempts < 3) {
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
        break;
      } catch (error) {
        setChatHistory((prev) => [
          ...prev,
          { type: "answer", text: error.response?.status === 429 ? "Rate limit exceeded. Try again later." : "Error occurred. Try again." },
        ]);
        break;
      }
    }

    setGeneratingAnswer(false);
  }

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111] text-gray-100" : "bg-white text-gray-900"}`}>
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
          <h1 className="text-4xl font-bold text-pink-500 mb-6 animate-pulse">
            Welcome to Voqit Gemini 🌠
          </h1>
          <SignInButton mode="modal">
            <button className="px-6 py-3 font-semibold text-white rounded-lg bg-pink-500 shadow-lg hover:scale-105 transition-all duration-300">
              Start Chatting
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <header className={`p-4 shadow-sm border-b border-blue-500 ${isDarkMode ? "bg-[#111]" : "bg-white"} flex justify-between items-center`}>
          <h1 className="text-xl font-bold text-pink-500">Hello, {user?.firstName || "User"} 👋</h1>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/aarushidaksh" target="_blank" rel="noopener noreferrer" className="text-xl text-pink-400  hover:text-pink-300">
              <FaGithub />
            </a>
            <button onClick={toggleTheme} className="text-xl">
              {isDarkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-pink-600" />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>


        <main className={`flex-grow overflow-y-auto px-4 py-6 space-y-6 ${isDarkMode ? "bg-[#181818]" : "bg-gray-50"}`}>
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`max-w-3xl mx-auto px-6 py-4 rounded-lg text-base leading-relaxed shadow-md transition-all duration-300 ${
                chat.type === "question"
                  ? isDarkMode
                    ? "bg-[#1a1a1a] text-white text-right"
                    : "bg-pink-100 text-right"
                  : isDarkMode
                  ? "bg-[#1e1e1e] border border-blue-500 text-white"
                  : "bg-white border border-blue-500 text-left"
              }`}
            >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children }) {
                    return (
                      <pre className={`rounded-md my-4 p-4 text-sm overflow-x-auto ${
                        isDarkMode ? "bg-[#0c0c0c] text-pink-300" : "bg-gray-100 text-pink-800"
                      }`}>
                        <code>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {chat.text}
              </ReactMarkdown>
              {chat.type === "answer" && (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => toggleSpeaking(chat.text)}
                    className="text-pink-500 hover:text-pink-400"
                  >
                    <FaVolumeUp />
                  </button>
                  <ShareButtons answer={chat.text} />
                </div>
              )}
            </div>
          ))}
          {generatingAnswer && (
            <div className={`max-w-2xl mx-auto p-4 rounded-lg ${isDarkMode ? "bg-[#1e1e1e] border border-blue-500" : "bg-white border border-blue-500"} animate-pulse`}>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          )}
        </main>

        <form
          onSubmit={generateAnswer}
          className={`flex items-center ${isDarkMode ? "bg-[#111] border-t border-blue-500" : "bg-white border-t border-blue-500"} p-4 justify-center`}
        >
          <div className="flex w-full max-w-screen-md items-center">
            <textarea
              required
              className={`flex-grow rounded-lg px-4 py-3 h-14 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                isDarkMode ? "bg-[#1c1c1c] text-white" : "bg-gray-100 text-gray-900"
              }`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything..."
            />
            <div className="flex items-center space-x-3 ml-4">
              {recognition && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-full transition ${
                    isListening ? "bg-red-500" : "bg-pink-500"
                  } hover:scale-105 text-white`}
                >
                  <FaMicrophone />
                </button>
              )}
              <button
                type="submit"
                className="p-3 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg text-white"
                disabled={generatingAnswer}
              >
                <FaPaperPlane className={`${generatingAnswer ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        </form>

        {/* <Footer /> */}
      </SignedIn>
    </div>
  );
}

export default App;
