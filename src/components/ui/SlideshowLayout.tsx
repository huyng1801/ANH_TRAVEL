"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SlideshowLayout({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const images = ["/rectangle20.svg", "/rectangle21.svg", "/rectangle22.svg"];

  useEffect(() => {
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % images.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Bóng mờ */}
      <div className="absolute w-[500px] h-[500px] bg-[var(--secondary)] opacity-50 blur-[250px]" style={{ top: "-220px", left: "-140px" }} />
      <div className="absolute w-[500px] h-[500px] bg-[var(--primary)] opacity-50 blur-[250px]" style={{ top: "-230px", left: "1170px" }} />
      <div className="absolute w-[500px] h-[500px] bg-[var(--primary)] opacity-50 blur-[250px]" style={{ top: "700px", left: "-60px" }} />
      <div className="absolute w-[500px] h-[500px] bg-[var(--secondary)] opacity-50 blur-[250px]" style={{ top: "650px", left: "1160px" }} />

      {/* Layout chính */}
      <div className="w-full px-8 lg:px-12 xl:px-20 2xl:px-30 relative z-10">
        <div className="flex w-full flex-col md:flex-row">
          {/* Cột form */}
          <div
            className={`flex-1 flex flex-col justify-center items-center relative z-10 ${
              reverse ? "order-2 md:ml-8" : "order-1 md:mr-8"
            }`}
          >
            {/* Logo thu nhỏ dần */}
            <div className="relative 
              w-[200px] h-[60px]   /* base */
              md:w-[260px] md:h-[80px] /* 768px */
              lg:w-[320px] lg:h-[90px] /* 1024px */
              xl:w-[350px] xl:h-[100px] /* 1280px+ */
              mb-6"
            >
              <Image
                src="/logo.png"
                alt="Sài Gòn Đi"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="w-full max-w-sm md:max-w-md">{children}</div>
          </div>

          {/* Cột hình */}
          <div
            className={`flex-1 hidden sm:hidden md:flex justify-center items-center ${
              reverse ? "order-1 md:ml-4 lg:ml-6" : "order-2 md:mr-4 lg:mr-6"
            }`}
          >
            {/* Hình thu nhỏ dần */}
            <div className="
              relative 
              w-[320px] h-[450px]     /* base */
              md:w-[350px] md:h-[560px] /* 768px */
              lg:w-[430px] lg:h-[650px] /* 1024px */
              xl:w-[550px] xl:h-[750px] /* 1280px+ */
              rounded-3xl overflow-hidden"
            >
              <Image
                src={images[current]}
                alt="Slideshow"
                fill
                className="object-cover transition-all duration-700"
                priority
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === current
                        ? "w-6 bg-[var(--secondary)]"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
