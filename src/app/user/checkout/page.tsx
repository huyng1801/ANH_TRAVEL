// /app/user/checkout/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
} from "lucide-react";

import { useGetTourById } from "#/hooks/tours-hook/useTourDetail";
import { createBooking } from "@/lib/checkout/checkoutApi";
import { authApi } from "@/lib/auth/authApi";
import { useAuthStore } from "#/stores/auth";
import { getUserToken } from "@/lib/auth/tokenManager";
import { debugTokenAndUser } from "@/lib/auth/tokenDebug";
import type { CreateBookingBody } from "@/lib/checkout/checkoutApi";

/* ========== Helpers ========== */
const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};
const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, " VNĐ")
    : "—";
const dmy = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhoneVN = (s: string) =>
  /^(\+?84|0)(\d{9,10})$/.test(s.replace(/\s+/g, ""));

/* ========== Page ========== */
export default function CheckoutPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const accessToken = token?.accessToken || getUserToken();

  const id = (search.get("id") ?? "").toString();
  const initAdults = Math.max(1, Number(search.get("adults") ?? 1));
  const initChildren = Math.max(0, Number(search.get("children") ?? 0));

  const { data: tour, isLoading, isError } = useGetTourById(id);

  // Form state
  const [formData, setFormData] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [adults, setAdults] = React.useState(initAdults);
  const [children, setChildren] = React.useState(initChildren);
  const [paymentMethod, setPaymentMethod] = React.useState<"office-payment" | "vnpay-payment">("office-payment");
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof formData | "submit", string>>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [isReadOnly, setIsReadOnly] = React.useState(false);

  // Fetch user profile nếu đã đăng nhập
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (!accessToken) {
        debugTokenAndUser.logTokenLoad("Checkout.loadUserProfile[noToken]");
        return;
      }

      // Nếu có user info trong store thì dùng luôn
      if (user) {
        const newFormData = {
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: "", // Backend không có trường này
        };
        setFormData(newFormData);
        setIsReadOnly(true);
        debugTokenAndUser.logCheckoutPreFill("Checkout.loadUserProfile[fromStore]", {
          ...newFormData,
          isReadOnly: true,
        });
        return;
      }

      // Nếu không có user trong store thì fetch từ API
      debugTokenAndUser.logTokenLoad("Checkout.loadUserProfile[fetchAPI]");

      try {
        const profile = await authApi.getProfile(accessToken);
        debugTokenAndUser.logUserProfileLoad("Checkout.loadUserProfile[success]", profile);
        if (profile) {
          const newFormData = {
            fullName: profile.fullName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: "", // Backend không có trường này
          };
          setFormData(newFormData);
          setIsReadOnly(true); // Đặt thành read-only
          debugTokenAndUser.logCheckoutPreFill("Checkout.loadUserProfile[preFill]", {
            ...newFormData,
            isReadOnly: true,
          });
        }
      } catch (err) {
        console.error("Lỗi khi fetch user profile:", err);
        debugTokenAndUser.logUserProfileLoad("Checkout.loadUserProfile[error]", {
          error: err,
        });
        // Nếu lỗi thì cho phép user điền form bình thường
        setIsReadOnly(false);
      }
    };

    loadUserProfile();
  }, [accessToken, user]);

  // Giá
  const priceAdult = toNum(tour?.priceAdult) ?? 0;
  const priceChild = toNum(tour?.priceChild) ?? 0;
  const coverImg =
    tour?.images?.[0] || tour?.image || tour?.cover || "/hot1.jpg";

  const listed = adults * priceAdult + children * priceChild;
  const totalDisplay = listed;

  // Validation
  const validateField = (name: keyof typeof formData, value: string) => {
    if (name !== "address" && !value.trim()) return "Vui lòng không để trống.";
    if (name === "email" && !isEmail(value)) return "Email không hợp lệ.";
    if (name === "phone" && !isPhoneVN(value))
      return "Số điện thoại không hợp lệ.";
    return undefined;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error, submit: undefined }));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name])
      setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  };

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // validate all
    const newErrors: typeof errors = {};
    let hasError = false;
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((k) => {
      if (k === "address") return;
      const msg = validateField(k, formData[k]);
      if (msg) {
        newErrors[k] = msg;
        hasError = true;
      }
    });
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const total = Number(totalDisplay) || 0;

    const payload: CreateBookingBody = {
      tourId: String(tour?._id ?? id),
      contact: {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
      },
      guests: { adults: Number(adults) || 1, children: Number(children) || 0 },
      pricing: {
        priceAdult: Number(priceAdult) || 0,
        priceChild: Number(priceChild) || 0,
        total,
      },
      paymentMethod, // FE value; API đã map -> "office"
      couponCode: null,
    };

    try {
      setSubmitting(true);
      const res = await createBooking(payload);

      // Nếu có redirectUrl (VNPay, MoMo) thì chuyển hướng đến trang thanh toán
      if (res?.payment?.redirectUrl) {
        window.location.href = res.payment.redirectUrl;
        return;
      }

      // Nếu thanh toán tại văn phòng thì chuyển hướng đến trang success
      if (res?.code) {
        const sp = new URLSearchParams();
        sp.append("bookingId", res.code);
        sp.append("email", payload.contact.email);
        router.replace(`/user/checkout/success?${sp.toString()}`);
        return;
      }

      setErrors({ submit: "Không tạo được đơn đặt chỗ. Vui lòng thử lại." });
    } catch (err: any) {
      setErrors({
        submit: err?.message || "Đặt chỗ thất bại. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading/Error tour
  if (!id)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">Thiếu mã tour.</div>
    );
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-slate-600">Đang tải thông tin tour…</p>
        </div>
      </div>
    );
  if (isError || !tour)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        Không tìm thấy tour.
      </div>
    );

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10" suppressHydrationWarning>
      {/* Banner mini + breadcrumb */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-white p-5"
      >
        <nav className="text-sm text-slate-600">
          <Crumb href="/">Trang chủ</Crumb> /{" "}
          <Crumb href="/user">Tài khoản</Crumb> /{" "}
          <span className="font-medium text-slate-900">Đặt tour</span>
        </nav>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-slate-900">
          Tổng quan chuyến đi
        </h1>
        <p className="text-slate-600">
          {tour.title} • {tour.destination ?? "Điểm đến"} —{" "}
          {dmy(tour.startDate)} → {dmy(tour.endDate)}
        </p>
      </motion.section>

      {/* Layout 2 cột */}
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        {/* LEFT */}
        <div className="space-y-8 lg:col-span-7">
          {/* Thông tin liên lạc */}
          <Card>
            <h2 className="section-title mb-4">Thông tin liên lạc</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ và tên *" error={errors.fullName}>
                <Input
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  icon={<User size={18} />}
                  aria-invalid={!!errors.fullName}
                />
              </Field>
              <Field label="Email *" error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  icon={<Mail size={18} />}
                  aria-invalid={!!errors.email}
                />
              </Field>
              <Field label="Số điện thoại *" error={errors.phone}>
                <Input
                  name="phone"
                  placeholder="0912 345 678"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  icon={<Phone size={18} />}
                  aria-invalid={!!errors.phone}
                />
              </Field>
              <Field label="Địa chỉ" error={errors.address}>
                <Input
                  name="address"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  icon={<MapPin size={18} />}
                  aria-invalid={!!errors.address}
                />
              </Field>
            </div>
          </Card>

          {/* Số lượng hành khách */}
          <Card>
            <h2 className="section-title mb-4">Số lượng hành khách</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <QuantitySelector
                label="Người lớn"
                value={adults}
                onChange={setAdults}
                min={1}
              />
              <QuantitySelector
                label="Trẻ em"
                value={children}
                onChange={setChildren}
                min={0}
              />
            </div>
          </Card>

          {/* Điều khoản */}
          <Card>
            <h2 className="section-title mb-3">Điều khoản & bảo mật</h2>
            <p className="text-[15px] leading-relaxed text-slate-700">
              Bằng cách nhấn <b>“Xác nhận đặt chỗ”</b>, bạn chấp thuận điều
              khoản sử dụng dịch vụ. Vui lòng đọc kỹ trước khi tiếp tục.
            </p>
            <label className="mt-3 inline-flex select-none items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                defaultChecked
                required
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Tôi đã đọc và đồng ý với{" "}
              <a className="link" href="#" target="_blank" rel="noreferrer">
                Điều khoản thanh toán
              </a>
            </label>
          </Card>

          {/* Phương thức thanh toán */}
          <Card>
            <h2 className="section-title mb-4">Phương thức thanh toán</h2>
            <PaymentMethodSelector 
              value={paymentMethod} 
              onChange={setPaymentMethod} 
            />
          </Card>
        </div>

        {/* RIGHT: Tóm tắt + Submit */}
        <div className="lg:col-span-5 self-start sticky top-6 space-y-8">
          {/* Thông tin tour */}
          <Card className="p-5">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image
                  src={coverImg}
                  alt={tour.title ?? "tour"}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 1024px) 100vw, 96px"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src = "/hot1.jpg")
                  }
                />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-slate-800 leading-snug">
                  {tour.title}
                </h4>
                <p className="text-sm text-slate-600 mt-1.5">
                  Thời gian: <b>{tour.time ?? "—"}</b>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Khởi hành: <b>{dmy(tour.startDate)}</b>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Kết thúc: <b>{dmy(tour.endDate)}</b>
                </p>
              </div>
            </div>
          </Card>

          {/* Tóm tắt tiền */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Tóm tắt đơn hàng
              </h3>
            </div>
            <div className="p-5">
              <div className="mb-4 border-b pb-4 text-[15px]">
                <Row label="Người lớn">
                  <span className="tabular-nums">
                    {adults.toLocaleString("vi-VN")} × {vnd(priceAdult)}
                  </span>
                </Row>
                {children > 0 && (
                  <Row label="Trẻ em">
                    <span className="tabular-nums">
                      {children.toLocaleString("vi-VN")} × {vnd(priceChild)}
                    </span>
                  </Row>
                )}
                <Row label={<b>Tổng cộng</b>} strong>
                  <b className="tabular-nums text-lg">{vnd(totalDisplay)}</b>
                </Row>
              </div>

              {/* Lỗi Submit */}
              <AnimatePresence>
                {errors.submit && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{errors.submit}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Button
                  type="submit"
                  full
                  className="py-3 text-base"
                  disabled={submitting}
                >
                  {submitting ? "Đang tạo đơn..." : "Xác nhận đặt chỗ"}
                </Button>
                <Link
                  href={`/user/destination/${(
                    tour.destinationSlug ??
                    (tour.title || "")
                  )
                    .toString()
                    .toLowerCase()
                    .replace(/\s+/g, "-")}/${tour._id ?? id}`}
                  className="block text-center text-sm text-slate-600 underline underline-offset-2 hover:text-slate-800"
                >
                  Xem chi tiết tour
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </main>
  );
}

/* ========== UI bits ========== */
function Crumb(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className="rounded px-1 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    />
  );
}
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-15px_rgba(2,6,23,0.18)] ${className}`}
    >
      {children}
    </motion.section>
  );
}
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="block">
      <span className="block text-[13px] font-medium text-slate-600">
        {label}
      </span>
      <div className="mt-1">
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1 text-xs font-medium text-rose-600 overflow-hidden"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
function Row({
  label,
  children,
  strong,
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${className}`}>
      <span
        className={`text-slate-600 ${
          strong ? "font-semibold text-slate-900" : ""
        }`}
      >
        {label}
      </span>
      <span className={`text-slate-800 ${strong ? "font-semibold" : ""}`}>
        {children}
      </span>
    </div>
  );
}
function Button({
  variant = "primary",
  full,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "danger";
  full?: boolean;
}) {
  const base =
    "relative inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-60";
  const styles: Record<string, string> = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
    soft: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-emerald-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${
        full ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
function Input({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  const hasError = (props as any)["aria-invalid"];
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputId, setInputId] = React.useState("");

  React.useEffect(() => {
    if (!props.id) {
      setInputId(`input-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    }
  }, [props.id]);

  const finalId = props.id || inputId;

  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-slate-400">{icon}</span>
        </div>
      )}
      <input
        {...props}
        ref={inputRef}
        id={finalId}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-[15px] text-slate-800 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-75 disabled:bg-slate-50 disabled:cursor-not-allowed ${
          icon ? "pl-10" : ""
        } ${
          hasError
            ? "border-rose-400 ring-1 ring-rose-400 focus-visible:ring-rose-400"
            : "border-slate-200 focus-visible:ring-emerald-400"
        } ${className}`}
      />
    </div>
  );
}
function QuantitySelector({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <StepButton
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        />
        <span className="w-10 text-center text-lg font-bold tabular-nums">
          {value}
        </span>
        <StepButton
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          plus
        />
      </div>
    </Field>
  );
}
function StepButton({
  plus,
  disabled,
  onClick,
}: {
  plus?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-10 w-10 rounded-xl border text-slate-700 transition ${
        plus
          ? "border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100"
          : "border-slate-200 hover:bg-slate-50 active:bg-slate-100"
      } disabled:opacity-40`}
    >
      {plus ? "+" : "−"}
    </button>
  );
}
function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: "office-payment" | "vnpay-payment";
  onChange: (value: "office-payment" | "vnpay-payment") => void;
}) {
  return (
    <div className="space-y-3">
      {/* Thanh toán tại văn phòng */}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
          value === "office-payment"
            ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/clients/assets/images/contact/icon.png"
          alt=""
          className="h-6 w-6 rounded object-cover"
        />
        <input
          type="radio"
          name="paymentMethod"
          value="office-payment"
          checked={value === "office-payment"}
          onChange={() => onChange("office-payment")}
          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="font-medium text-slate-800">Tại văn phòng</span>
      </label>

      {/* Thanh toán VNPay */}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
          value === "vnpay-payment"
            ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png"
          alt="VNPay"
          className="h-6 w-auto rounded object-cover"
        />
        <input
          type="radio"
          name="paymentMethod"
          value="vnpay-payment"
          checked={value === "vnpay-payment"}
          onChange={() => onChange("vnpay-payment")}
          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="font-medium text-slate-800">VNPay</span>
      </label>
      
      {value === "vnpay-payment" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-slate-700"
        >
          <p className="font-medium text-blue-900 mb-1">Thanh toán qua VNPay</p>
          <p className="text-blue-800">
            Bạn sẽ được chuyển đến trang thanh toán VNPay để hoàn tất giao dịch.
            Hỗ trợ các ngân hàng nội địa và thẻ quốc tế.
          </p>
        </motion.div>
      )}
    </div>
  );
}
