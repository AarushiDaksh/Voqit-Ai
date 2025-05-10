import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Footer from "./Footer";
import ShareButtons from "./components/ShareButtons";
import { FaMicrophone, FaPaperPlane, FaVolumeUp } from "react-icons/fa";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

const cache = new Map();

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim()) return;
    if (generatingAnswer) return;

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
    const maxAttempts = 3;
    let delay = 2000;

    while (attempts < maxAttempts) {
      try {
        const response = await axios({
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          method: "post",
          headers: { "Content-Type": "application/json" },
          data: { contents: [{ parts: [{ text: question }] }] },
        });

        if (response.data?.candidates?.length > 0) {
          const fullAnswer = response.data.candidates[0].content.parts[0].text;
          cache.set(question, fullAnswer);

          setChatHistory((prev) => [
            ...prev,
            { type: "question", text: question },
            { type: "answer", text: fullAnswer },
          ]);
          setQuestion("");
        } else throw new Error("Invalid API response structure");

        break;
      } catch (error) {
        console.error("API Error:", error);

        if (error.response?.status === 429 && attempts < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          attempts++;
        } else {
          setChatHistory((prev) => [
            ...prev,
            {
              type: "answer",
              text:
                error.response?.status === 429
                  ? "Rate limit exceeded. Please try again later."
                  : "Sorry, something went wrong. Please try again!",
            },
          ]);
          break;
        }
      }
    }

    setGeneratingAnswer(false);
  }

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-white">
<SignedOut>
  <div className="flex flex-col items-center justify-center h-screen bg-black text-center px-4">
    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-fuchsia-400 animate-pulse mb-6">
      Welcome to Voqit-Ai
    </h1>
    <SignInButton mode="modal">
            <button className="px-6 py-2 text-white font-semibold rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-lg hover:scale-105 transition-all duration-300">
              Start Now
            </button>
          </SignInButton>
        </div>
      </SignedOut>


      <SignedIn>
        <header className="bg-[#1a1a1a] p-4 text-center shadow-md border-b border-[#2c2c2e] flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-400">Hello, {user?.firstName || "User"} 👋</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <main className="flex-grow overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-[#444]">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`max-w-2xl mx-auto p-4 rounded-lg text-base shadow-inner backdrop-blur ${
                chat.type === "question"
                  ? "bg-gradient-to-br from-pink-600 to-pink-400 text-white text-right animate-glow"
                  : "bg-[#1f1f1f] text-left border border-[#2c2c2e]"
              }`}
            >
              <ReactMarkdown>{chat.text}</ReactMarkdown>
              {chat.type === "answer" && (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => toggleSpeaking(chat.text)}
                    className="text-pink-400 hover:text-pink-300"
                  >
                    <FaVolumeUp />
                  </button>
                  <ShareButtons answer={chat.text} />
                </div>
              )}
            </div>
          ))}
          {generatingAnswer && (
            <div className="max-w-2xl mx-auto p-4 rounded-lg bg-[#1f1f1f] animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </main>

        <form onSubmit={generateAnswer} className="flex items-center bg-[#1a1a1a] p-4 border-t border-[#2c2c2e]">
          <textarea
            required
            className="flex-grow bg-[#121212] text-white rounded-lg px-4 py-3 h-14 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
          />
          <div className="flex items-center space-x-3 ml-4">
            {recognition && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-full shadow transition ${
                  isListening ? "bg-red-500" : "bg-pink-600"
                } hover:scale-105`}
              >
                <FaMicrophone />
              </button>
            )}
            <button
              type="submit"
              className="p-3 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg"
              disabled={generatingAnswer}
            >
              <FaPaperPlane className={`text-white ${generatingAnswer ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </form>

        <Footer />
      </SignedIn>
    </div>
  );
}

export default App;
