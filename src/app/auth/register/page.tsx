// src/app/auth/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRegister } from "#/hooks/auth-hook/useAuth";

export default function RegisterPage() {
  const router = useRouter();

  const [userName, setUserName] = useState(""); // Tên
  const [fullName, setFullName] = useState(""); // Họ và tên lót
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState("");
  const { mutate: registerMutate, isPending } = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return; // chặn double-submit

    const newErrors: { [key: string]: string } = {};

    // Enhanced validation
    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    if (!userName.trim()) {
      newErrors.userName = "Vui lòng nhập Username";
    } else if (userName.trim().length < 3) {
      newErrors.userName = "Username phải có ít nhất 3 ký tự";
    } else if (!/^[a-zA-Z0-9_]+$/.test(userName.trim())) {
      newErrors.userName = "Username chỉ được chứa chữ cái, số và dấu gạch dưới";
    }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10,11}$/.test(phone.trim().replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại phải có 10-11 chữ số";
    }

    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (password.trim().length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!agree) newErrors.agree = "Bạn cần đồng ý điều khoản";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setApiError("");
    const input = {
      fullName: fullName.trim(),
      username: userName.trim(),
      email: email.trim(),
      phoneNumber: phone.trim(),
      password: password.trim(),
    };
    registerMutate(input, {
      onSuccess: (data) => {
        console.log("Đăng ký thành công", data);
        setApiError("");
        // Redirect to login page after successful registration
        router.push("/auth/login?message=Đăng ký thành công! Vui lòng đăng nhập.");
      },
      onError: (error: any) => {
        let errorMessage = "Đăng ký thất bại";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          // Handle specific error messages
          if (errorMessage.includes("email already exists")) {
            errorMessage = "Email đã được sử dụng";
          } else if (errorMessage.includes("username already exists")) {
            errorMessage = "Username đã được sử dụng";
          }
        }
        setApiError(errorMessage);
      },
    });

  };

  // Handler tạm cho social (đổi sang route OAuth thực tế của bạn)
  const startOAuth = (provider: "facebook" | "google" | "apple") => {
    router.push(`/api/auth/${provider}`);
  };

  return (
    <>
      <h2 className="heading-2 font-bold text-[var(--secondary)] mb-1">
        ĐĂNG KÝ
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Hãy bắt đầu tạo tài khoản cho bản thân
      </p>

      {apiError && (
        <p className="text-[var(--warning)] text-sm mb-3">{apiError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 pt-5 pointer-events-auto">
        <div className="grid grid-cols-2 gap-4 pointer-events-auto">
          <div className="pointer-events-auto">
            <Input
              type="text"
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && (
              <p className="text-[var(--warning)] text-sm">{errors.fullName}</p>
            )}
          </div>
          <div className="pointer-events-auto">
            <Input
              type="text"
              label="User name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className={errors.userName ? "input-error" : ""}
            />
            {errors.userName && (
              <p className="text-[var(--warning)] text-sm">{errors.userName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pointer-events-auto">
          <div className="pointer-events-auto">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <p className="text-[var(--warning)] text-sm">{errors.email}</p>
            )}
          </div>
          <div className="pointer-events-auto">
            <Input
              type="text"
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && (
              <p className="text-[var(--warning)] text-sm">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="relative pointer-events-auto">
          <Input
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={errors.password ? "input-error" : ""}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 pointer-events-auto"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
          {errors.password && (
            <p className="text-[var(--warning)] text-sm">{errors.password}</p>
          )}
        </div>

        <div className="relative pointer-events-auto">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Xác thực mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={errors.confirmPassword ? "input-error" : ""}
          />
          <button
            type="button"
            aria-label={
              showConfirmPassword
                ? "Ẩn xác thực mật khẩu"
                : "Hiện xác thực mật khẩu"
            }
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 pointer-events-auto"
          >
            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
          {errors.confirmPassword && (
            <p className="text-[var(--error)] text-sm">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          <input
            type="checkbox"
            id="terms"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="w-4 h-4 rounded border-gray-300 pointer-events-auto cursor-pointer"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-600 pointer-events-auto cursor-pointer">
            Tôi đã đọc các điều khoản và điều kiện
          </label>
        </div>
        {errors.agree && (
          <p className="text-[var(--warning)] text-sm">{errors.agree}</p>
        )}

        {/* Quan trọng: Button của bạn phải forward prop `type` xuống <button> */}
        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4 pointer-events-auto"
          disabled={isPending}
        >
          {isPending ? "Đang đăng ký..." : "ĐĂNG KÝ"}
        </Button>
      </form>

      <p className="text-sm mt-6 text-gray-600 text-center pointer-events-auto">
        Bạn đã có tài khoản?{" "}
        <a href="/auth/login" className="text-[var(--primary)] hover:underline pointer-events-auto">
          Đăng nhập ngay
        </a>
      </p>

      <div className="flex items-center gap-2 pt-5 pointer-events-auto">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">Hoặc đăng ký bằng</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <div className="flex justify-center mt-8 space-x-4 pointer-events-auto">
        <Button
          variant="outline-primary"
          type="button"
          aria-label="Đăng ký bằng Facebook"
          onClick={() => startOAuth("facebook")}
          className="pointer-events-auto"
        >
          <FaFacebookF className="text-[var(--primary)] text-xl" />
        </Button>

        <Button
          variant="outline-primary"
          type="button"
          aria-label="Đăng ký bằng Google"
          onClick={() => startOAuth("google")}
          className="pointer-events-auto"
        >
          <FcGoogle className="text-xl" />
        </Button>

        <Button
          variant="outline-primary"
          type="button"
          aria-label="Đăng ký bằng Apple"
          onClick={() => startOAuth("apple")}
          className="pointer-events-auto"
        >
          <FaApple className="text-black text-xl" />
        </Button>
      </div>
    </>
  );
}
