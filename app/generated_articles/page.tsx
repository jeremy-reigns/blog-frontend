"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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

/* -------------------------------------------------------------------------- */
/*                Replace [Author Name] + [Date] inside Markdown               */
/* -------------------------------------------------------------------------- */
function injectMetadata(md: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return md
    .replace(/\[Author Name\]/gi, "PaceFlow")
    .replace(/\[Date\]/gi, today);
}

/* -------------------------------------------------------------------------- */
/*                        Clean Preview Text (500 chars)                       */
/* -------------------------------------------------------------------------- */
function createPreview(markdown: string, length = 500): string {
  const cleaned = markdown
    .replace(/[#_*`>-]/g, "")   // remove markdown symbols
    .replace(/\n+/g, " ")       // remove newlines
    .replace(/\s+/g, " ")       // collapse spaces
    .trim();

  return cleaned.length > length
    ? cleaned.substring(0, length) + "…"
    : cleaned;
}

/* -------------------------------------------------------------------------- */
/*                              Main Component                                 */
/* -------------------------------------------------------------------------- */
export default function GeneratedArticlesPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs`);
        const data = await res.json();
        setBlogs(data.reverse());
      } catch (err) {
        console.error("Error loading blogs:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  /* ----------------------------- Loading State ----------------------------- */
  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center text-gray-500">
        Loading articles…
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-4xl space-y-12">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Generated Articles
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            All blogs generated using your automated pipeline.
          </p>
        </div>

        {/* Empty State */}
        {blogs.length === 0 && (
          <p className="text-center text-gray-600">
            No articles found. Try generating one on the main page!
          </p>
        )}

        {/* Blog List */}
        <div className="space-y-6">
          {blogs.map((post) => {
            const expanded = expandedId === post.id;

            return (
              <div
                key={post.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-900 leading-snug">
                      {post.seo?.title || post.topic}
                    </h2>

                    {/* Timestamp */}
                    <p className="text-gray-500 text-sm mt-1">
                      Generated {new Date(post.created_at).toLocaleString()}
                    </p>

                    {/* PREVIEW (cleaned version) */}
                    <p className="text-gray-700 text-sm mt-3">
                      {createPreview(injectMetadata(post.final_post))}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : post.id)}
                    className="
                      text-sm border border-gray-700 rounded-md px-3 py-1
                      bg-gray-700 text-white
                      hover:bg-gray-800 transition
                    "
                  >
                    {expanded ? "Hide" : "Read"}
                  </button>
                </div>

                {/* ------------------------------ FULL ARTICLE ------------------------------ */}
                {expanded && (
                  <div
                    className="
                      mt-6 prose max-w-none

                      /* Headings */
                      prose-headings:font-bold
                      prose-h1:text-5xl prose-h1:text-blue-600 prose-h1:mt-10 prose-h1:mb-6
                      prose-h2:text-4xl prose-h2:text-purple-600 prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-3xl prose-h3:text-pink-600 prose-h3:mt-6 prose-h3:mb-3
                      prose-h4:text-2xl prose-h4:text-emerald-600 prose-h4:mt-4 prose-h4:mb-2

                      /* Body */
                      prose-p:text-gray-800 prose-p:leading-relaxed prose-p:my-4

                      /* Lists */
                      prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
                      prose-li:my-2 prose-li:text-gray-800
                      prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4

                      /* Quotes */
                      prose-blockquote:border-l-4
                      prose-blockquote:border-gray-300
                      prose-blockquote:pl-4
                      prose-blockquote:italic
                      prose-blockquote:text-gray-700

                      /* Misc */
                      prose-code:text-blue-700
                      prose-strong:font-bold prose-strong:text-gray-900

                      leading-loose tracking-wide text-black
                      !opacity-100
                    "
                  >
                    <ReactMarkdown>
                      {injectMetadata(post.final_post)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
