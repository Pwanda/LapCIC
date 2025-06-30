"use client";

import { useState, useEffect } from "react";
import { commentsApi, Comment } from "@/services/api";

function getAvatarUrl(username: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    username,
  )}&backgroundType=gradientLinear&fontSize=38`;
}

export default function CommentSection({ itemId }: { itemId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kommentare laden
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await commentsApi.getByItemId(itemId);
        setComments(data);
        setError(null);
      } catch {
        setError("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [itemId]);

  // Kommentar absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    try {
      const newComment = await commentsApi.add(itemId, input.trim());
      setComments([newComment, ...comments]);
      setInput("");
    } catch {
      setError("Failed to add comment");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-lg font-bold mb-4 text-black">Kommentare</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Schreibe einen Kommentar..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-black"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          Absenden
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-500">Lade Kommentare...</div>
        ) : comments.length === 0 ? (
          <div className="text-gray-500">Noch keine Kommentare.</div>
        ) : (
          comments.map((c, i) => (
            <div
              key={c.id || i}
              className="border-b border-gray-100 pb-2 flex items-start gap-3"
            >
              <img
                src={getAvatarUrl(c.user?.username || "Anonym")}
                alt={c.user?.username || "Anonym"}
                className="h-8 w-8 rounded-full border border-gray-200 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">
                    {c.user?.username || "Anonym"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("de-AT")
                      : ""}
                  </span>
                </div>
                <div className="text-black">{c.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
