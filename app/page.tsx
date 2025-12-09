"use client";

import { useState, FormEvent, useRef } from "react";
import Link from "next/link";

type SeoMeta = {
  title?: string;
  description?: string;
  tags?: string[];
};

type BlogPost = {
  id: string;
  topic: string;
  created_at: string;
  seo: SeoMeta;
  final_post: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BLOG_API_BASE_URL || "http://localhost:8000";

export default function BlogGenerationPage() {
  const [topic, setTopic] = useState("");
  const [progress, setProgress] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishedBlogId, setFinishedBlogId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    setTopic(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setProgress([]);
    setFinishedBlogId(null);

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setIsStreaming(true);

    const evtSource = new EventSource(
      `${API_BASE_URL}/generate-blog-stream?topic=${encodeURIComponent(topic)}`,
      { withCredentials: false }
    );

    evtSource.onmessage = (event) => {
      const message = event.data;

      // FINISHED
      if (message.startsWith("DONE::")) {
        const jsonText = message.replace("DONE::", "");
        const finalBlog: BlogPost = JSON.parse(jsonText);

        setFinishedBlogId(finalBlog.id);
        evtSource.close();
        setIsStreaming(false);
        setTopic("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        return;
      }

      // Normal progress event
      setProgress((prev) => [...prev, message]);
    };

    evtSource.onerror = () => {
      setError("Streaming error. Try again.");
      evtSource.close();
      setIsStreaming(false);
    };
  }

  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-4xl space-y-12">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Generate High-Quality Technical Blogs
          </h1>

          <p className="text-gray-600 text-lg mt-3 max-w-2xl mx-auto">
            Create polished, deeply researched blog posts using your custom prompt pipeline.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-500 rounded-xl shadow-sm p-6"
        >
          <label className="block text-center text-4xl font-extrabold mb-6 text-blue-600">
            Provide the Blog Topic
          </label>

          <textarea
            ref={textareaRef}
            rows={4}
            value={topic}
            onInput={handleTextareaInput}
            placeholder='e.g. "How do I write a great performance review?"'
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isStreaming}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-500 disabled:opacity-50"
            >
              {isStreaming ? "Generating..." : "Generate Blog"}
            </button>
          </div>
        </form>

        {/* STREAMING UI */}
        {isStreaming && (
          <div className="w-full bg-white border border-gray-300 rounded-2xl shadow-lg p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                Generating Blog…
              </h3>

              <div className="flex items-center gap-2">
                <span className="animate-ping w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 text-sm">Processing</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-3 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{
                  width: `${Math.min((progress.length / 10) * 100, 100)}%`,
                }}
              ></div>
            </div>

            {/* Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2">
              {progress.map((p, i) => {
                const isRunning = i === progress.length - 1;
                const isComplete = i < progress.length - 1;

                return (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {isRunning ? (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold animate-pulse">
                          ▶
                        </div>
                      ) : isComplete ? (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 font-bold">
                          ○
                        </div>
                      )}

                      <p
                        className={`font-medium ${
                          isRunning
                            ? "text-blue-700"
                            : isComplete
                            ? "text-green-700"
                            : "text-gray-600"
                        }`}
                      >
                        {p}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* SUCCESS MESSAGE — NEW */}
        {finishedBlogId && (
          <div className="mt-10 text-center">
            <p className="text-lg font-semibold text-green-700">
              Your blog has been successfully generated!
            </p>

            <Link
              href="/generated_articles"
              className="mt-4 inline-block text-blue-600 font-medium hover:underline text-lg"
            >
              View Your Article →
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
