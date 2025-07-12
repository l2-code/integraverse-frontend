import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bug, Send, X } from "lucide-react";
import { toast } from "sonner";

interface BugReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (personalMessage: string) => Promise<void>;
  isLoading?: boolean;
}

export function BugReportSheet({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: BugReportSheetProps) {
  const [personalMessage, setPersonalMessage] = useState("");

  const handleSubmit = async () => {
    try {
      await onSubmit(personalMessage);
      setPersonalMessage(""); // Clear the message after successful submission
      onOpenChange(false); // Close the dialog
    } catch (error) {
      console.error("Error submitting bug report:", error);
    }
  };

  const handleCancel = () => {
    setPersonalMessage(""); // Clear the message
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Report a Bug
          </SheetTitle>
          <SheetDescription>
            Help us improve by reporting any issues you encounter. 
            Your message will be sent along with the thread information.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personal-message">
              What went wrong? (Optional)
            </Label>
            <Textarea
              id="personal-message"
              placeholder="Describe the issue you encountered, what you were trying to do, and any other details that might help us understand the problem..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">What we'll include in the report:</p>
            <ul className="space-y-1 text-xs">
              <li>• Thread ID and conversation history</li>
              <li>• Your user information</li>
              <li>• Timestamp of when the issue occurred</li>
              <li>• Your personalized message (if provided)</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Report
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 