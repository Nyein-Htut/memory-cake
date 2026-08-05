"use client";
import { useRouter } from "next/navigation";

export default function OrderModal() {
  const router = useRouter();

  async function handleSubmit() {
    const res = await fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });

    if (res.ok) {
      // 1. Force Next.js Router Cache to clear and re-fetch active routes
      router.refresh(); 
      // 2. Redirect or close modal
    }
  }
}
