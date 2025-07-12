import { Button } from "@/components/ui/button";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose, BookOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useState, useEffect } from "react";
import { MarkdownText } from "@/components/thread/markdown-text";

function InstructionsContent({ content }: { content: string }) {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="prose prose-sm max-w-none w-full">
        <MarkdownText>{content}</MarkdownText>
      </div>
    </div>
  );
}

function InstructionsLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-4 w-full"
        />
      ))}
    </div>
  );
}

export default function InstructionsPanel() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [instructionsOpen, setInstructionsOpen] = useQueryState(
    "instructionsOpen",
    parseAsBoolean.withDefault(false),
  );
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const response = await fetch("/INSTRUCTIONS.md");
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          setContent("# Instructions\n\nInstructions file not found.");
        }
      } catch (error) {
        console.error("Failed to load instructions:", error);
        setContent("# Instructions\n\nFailed to load instructions.");
      } finally {
        setLoading(false);
      }
    };

    loadInstructions();
  }, []);

  return (
    <>
      <div className="shadow-inner-left hidden h-screen w-[300px] shrink-0 flex-col items-start justify-start gap-6 border-l-[1px] border-slate-300 lg:flex">
        <div className="flex w-full items-center justify-between px-4 pt-1.5">
          <Button
            className="hover:bg-gray-100"
            variant="ghost"
            onClick={() => setInstructionsOpen((p) => !p)}
          >
            {instructionsOpen ? (
              <PanelRightClose className="size-5" />
            ) : (
              <PanelRightOpen className="size-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <BookOpen className="size-5" />
            Instructions
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        {loading ? (
          <InstructionsLoading />
        ) : (
          <InstructionsContent content={content} />
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!instructionsOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setInstructionsOpen(open);
          }}
        >
          <SheetContent
            side="right"
            className="flex lg:hidden"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Instructions
              </SheetTitle>
            </SheetHeader>
            {loading ? (
              <InstructionsLoading />
            ) : (
              <InstructionsContent content={content} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
} 