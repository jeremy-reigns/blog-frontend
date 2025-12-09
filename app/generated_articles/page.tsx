"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  process.env.NEXT_PUBLIC_BLOG_API_BASE_URL ||
  "https://blog-backend-production-34cf.up.railway.app";

/* ---------------------------- Clean Markdown ---------------------------- */

function injectMetadata(md: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return md
    .replace(/\[Author Name\]/gi, "PaceFlow")
    .replace(/\[Date\]/gi, today);
}

function cleanMarkdown(md: string): string {
  if (!md) return "";
  let text = md.trim();

  // Remove summary headers before first heading
  const firstH1 = text.indexOf("# ");
  if (firstH1 > 0) text = text.substring(firstH1);

  // Remove noise lines
  text = text.replace(/^Generated.*$/gim, "");
  text = text.replace(/^Hide$/gim, "");

  // Remove duplicate headings
  const lines = text.split("\n");
  const seen = new Set<string>();
  const filtered: string[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (seen.has(line.trim())) continue;
      seen.add(line.trim());
    }
    filtered.push(line);
  }

  text = filtered.join("\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return injectMetadata(text);
}

/* ---------------------------- Preview Cleaner --------------------------- */
function createPreview(markdown: string, length = 500): string {
  const cleaned = markdown
    .replace(/[#_*`>-\[\]]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > length
    ? cleaned.substring(0, length) + "…"
    : cleaned;
}

/* ------------------------------ MAIN PAGE ------------------------------- */

export default function GeneratedArticlesPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [summary, setSummary] = useState<string>("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs`);
        const data = await res.json();
        setBlogs(data.reverse());
      } catch (e) {
        console.error("Error loading blogs:", e);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  /* ------------------------------ PDF Export ----------------------------- */
  async function exportPDF(postId: string) {
    const element = document.getElementById(`article-${postId}`);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`article-${postId}.pdf`);
  }

  /* --------------------- AI LinkedIn Summary Generator ------------------- */
  async function generateLinkedInSummary(post: BlogPost) {
    setSummary("Generating...");
    setShowSummaryModal(true);

    try {
      const res = await fetch(`${API_BASE_URL}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanMarkdown(post.final_post),
          style: "linkedin",
        }),
      });

      const data = await res.json();
      setSummary(data.summary || "Error: No summary received.");
    } catch (err) {
      setSummary("Error generating summary.");
      console.error(err);
    }
  }

  /* ------------------------------ Loading UI ----------------------------- */
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Generated Articles</h1>
          <p className="text-gray-600 mt-3">All blogs generated using your automated pipeline.</p>
        </div>

        {blogs.length === 0 && (
          <p className="text-center text-gray-600">No articles yet.</p>
        )}

        <div className="space-y-6">
          {blogs.map((post) => {
            const expanded = expandedId === post.id;
            const cleaned = cleanMarkdown(post.final_post);

            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{post.seo?.title || post.topic}</h2>
                    <p className="text-sm text-gray-500">
                      Generated {new Date(post.created_at).toLocaleString()}
                    </p>

                    <p className="text-gray-800 text-sm mt-3">
                      {createPreview(cleaned)}
                    </p>
                  </div>

                  <button
                    onClick={() => setExpandedId(expanded ? null : post.id)}
                    className="px-3 py-1 bg-gray-800 text-white rounded"
                  >
                    {expanded ? "Hide" : "Read"}
                  </button>
                </div>

                {/* --- FULL ARTICLE --- */}
                {expanded && (
                  <div id={`article-${post.id}`} className="mt-6 prose prose-lg text-black">
                    <ReactMarkdown>{cleaned}</ReactMarkdown>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => exportPDF(post.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Save as PDF
                      </button>

                      <button
                        onClick={() => generateLinkedInSummary(post)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Generate LinkedIn Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------ SUMMARY MODAL ------------------------ */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-lg p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold">LinkedIn Summary</h2>

            <textarea
              className="w-full h-48 border rounded p-3 text-gray-800"
              value={summary}
              readOnly
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowSummaryModal(false)}
              >
                Close
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={() => navigator.clipboard.writeText(summary)}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
