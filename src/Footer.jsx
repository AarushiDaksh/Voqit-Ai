import { FaGithub, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#10192e] text-white py-4 text-center shadow-inner w-full">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-6 mb-3">
          <a
            href="https://github.com/aarushidaksh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-white transform hover:scale-110 transition duration-300 flex items-center"
          >
            <FaGithub className="mr-1" /> GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/aarushidaksh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-white transform hover:scale-110 transition duration-300 flex items-center"
          >
            <FaLinkedin className="mr-1" /> LinkedIn
          </a>
        </div>
        <p className="text-xs text-gray-500">&copy; 2025 Voqit-Ai. Built with ❤️ by Aarushi.</p>
      </div>
    </footer>
  );
};

export default Footer;
