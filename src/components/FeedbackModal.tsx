import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current page URL and timestamp
      const pageUrl = window.location.href;
      const timestamp = new Date().toISOString();

      const response = await fetch("/api/send-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          pageUrl,
          timestamp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Thank you for your feedback!");
        setMessage("");
        onClose();
      } else {
        toast.error(data.error || "Failed to send feedback");
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Center modal with padding */}
      {/* Desktop: Bottom-right corner, no overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center md:items-end md:justify-end p-4 md:p-6"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md md:max-w-sm font-jost"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">Send Feedback</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
              We&apos;d love to hear your thoughts, suggestions, or bug reports!
            </p>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[120px] resize-none font-jost bg-white text-base"
              style={{ fontSize: '16px' }}
              disabled={isSubmitting}
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-jost"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="font-jost bg-[#7cb46b] hover:bg-[#6a9d5b] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default FeedbackModal;

