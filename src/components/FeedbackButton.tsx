import * as React from "react";
import FeedbackModal from "./FeedbackModal";
import { MessageSquare } from "lucide-react";

const FeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-white text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-4 py-3 border border-gray-200 hover:border-gray-300 z-50 font-jost"
        style={{ letterSpacing: "0.05em" }}
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default FeedbackButton;

