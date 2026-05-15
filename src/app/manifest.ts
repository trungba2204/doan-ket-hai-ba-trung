import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Đoàn kết Hai Bà Trưng",
    short_name: "HBT FC",
    description: "Quản lý đội bóng, tiền sân và nhắc sinh nhật.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#172554",
    icons: [
      {
        src: "/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.jpg",
        sizes: "180x180",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
