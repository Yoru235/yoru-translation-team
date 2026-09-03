"use client";

import { useEffect, useState } from "react";

type RatingStarsProps = {
  mangaId: string;
  initialRating: number;
};

export default function RatingStars({
  mangaId,
  initialRating,
}: RatingStarsProps) {
  const [rating, setRating] = useState(initialRating);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  async function submitRating(value: number) {
    if (loading) return;

    setLoading(true);
    setSelected(value);

    try {
      const response = await fetch(
        `/api/mangas/${mangaId}/rating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setRating(data.average);
      }
    } catch (error) {
      console.error("Lỗi gửi rating:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">
        Đánh giá
      </p>

      <div className="mt-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            onClick={() => submitRating(star)}
            className="text-2xl transition hover:scale-110"
            aria-label={`Đánh giá ${star} sao`}
          >
            <span
              className={
                star <= (selected || Math.round(rating))
                  ? "text-yellow-400"
                  : "text-gray-600"
              }
            >
              ★
            </span>
          </button>
        ))}

        <span className="ml-2 text-sm text-gray-300">
          {rating.toFixed(1)} / 5
        </span>
      </div>
    </div>
  );
}