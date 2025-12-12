"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  useMyBookings,
  useCancelBooking,
} from "#/hooks/bookings-hook/useBooking";
import {
  formatVND,
  fmtDate,
  StatusChip,
  classifyBooking,
  type BookingTab,
} from "./_utils";

/* ---------- Tabs helper ---------- */
const tabs: { key: BookingTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ thanh toán" },
  { key: "upcoming", label: "Sắp khởi hành" },
  { key: "done", label: "Hoàn thành" },
  { key: "canceled", label: "Đã huỷ" },
];

export default function MyBookingsPage() {
  // Check for payment status from URL
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");
  const bookingCode = searchParams.get("code");
  const [showNotification, setShowNotification] = React.useState(!!paymentStatus);
  
  // Auto-hide notification after 5 seconds
  React.useEffect(() => {
    if (paymentStatus) {
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  // data
  const { data, isLoading, isError, refetch } = useMyBookings();
  const cancelMut = useCancelBooking({
    onSuccess: () => refetch(),
  });

  const [activeTab, setActiveTab] = React.useState<BookingTab>("all");
  
  const list = React.useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const filtered = React.useMemo(() => {
    if (activeTab === "all") return list;
    return list.filter((b) => classifyBooking(b) === activeTab);
  }, [list, activeTab]);

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-8">
      {/* Payment Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 rounded-xl border p-4 ${
              paymentStatus === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex items-center gap-3">
              {paymentStatus === "success" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  paymentStatus === "success" ? "text-emerald-900" : "text-rose-900"
                }`}>
                  {paymentStatus === "success"
                    ? "Thanh toán thành công!"
                    : "Thanh toán thất bại"}
                </p>
                <p className={`text-sm mt-1 ${
                  paymentStatus === "success" ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {paymentStatus === "success"
                    ? `Đơn đặt chỗ ${bookingCode || ""} đã được thanh toán thành công. Chúng tôi đã gửi email xác nhận.`
                    : "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className={`text-sm font-medium ${
                  paymentStatus === "success"
                    ? "text-emerald-600 hover:text-emerald-800"
                    : "text-rose-600 hover:text-rose-800"
                }`}
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header giống trang Cài đặt */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          Đặt chỗ của tôi
        </h1>
        <p className="mt-1 text-[15px] text-slate-600">
          Xem lại các đơn đặt tour, thanh toán cọc hoặc huỷ nếu cần.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === t.key
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Nội dung */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          Đang tải danh sách đặt chỗ…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Không tải được dữ liệu. Vui lòng thử lại.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Bạn chưa có đặt chỗ nào trong mục “
          {tabs.find((t) => t.key === activeTab)?.label}”.
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map((b) => (
            <BookingRow
              key={b?.code ?? b?._id}
              booking={b}
              onCancel={() =>
                cancelMut.mutate(String(b?.code ?? b?.bookingCode ?? ""))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
/* ---------- 1 item booking (giống card ở trang Cài đặt) ---------- */
function BookingRow({
  booking,
  onCancel,
}: {
  booking: any;
  onCancel: () => void;
}) {
  const status = classifyBooking(booking);
  
  // Extract tour data from adapted booking item
  const title = booking?.tourTitle || "Tour";
  const image = booking?.tourImage || "/hot1.jpg";
  const destination = booking?.tourDestination || "Điểm đến";
  const time = booking?.time || "Thời lượng tuỳ tour";
  const startDate = booking?.startDate ? fmtDate(booking.startDate) : "Thời gian linh hoạt";
  const endDate = booking?.endDate ? fmtDate(booking.endDate) : "";
  
  const total = Number(booking?.totalPrice || 0);
  const paid = Number(booking?.paidAmount || 0);
  const remain = Math.max(0, total - paid);
  const guests =
    Number(booking?.numAdults || 0) + Number(booking?.numChildren || 0);
  const code = String(booking?.code ?? booking?.bookingCode ?? "");
  const tourId = String(booking?.tourId ?? "");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Ảnh */}
        <div className="relative h-[220px] overflow-hidden rounded-t-2xl md:h-full md:rounded-l-2xl md:rounded-tr-none">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/hot1.jpg";
            }}
          />
          <div className="absolute left-3 top-3">
            <StatusChip booking={booking} />
          </div>
        </div>

        {/* Nội dung */}
        <div className="flex flex-col gap-4 p-5 md:p-6">
          {/* header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold leading-tight">
                Đơn {code} • {title}
              </h2>
            </div>
            <div className="text-sm text-slate-500">
              Mã đơn <b className="text-slate-800">{code}</b>
            </div>
          </div>

          {/* 3 cột tổng/đã thanh toán/còn lại */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatBox
              icon={<CreditCard size={16} />}
              label="Tổng thanh toán"
              value={formatVND(total)}
            />
            <StatBox
              icon={<CheckCircle2 size={16} />}
              label="Đã thanh toán"
              value={formatVND(paid)}
            />
            <StatBox
              icon={<AlertCircle size={16} />}
              label="Còn lại"
              value={formatVND(remain)}
            />
          </div>

          {/* thông tin tour */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoPill
              icon={<Users size={16} />}
              text={`${guests} khách (NL ${booking?.numAdults || 0}${
                Number(booking?.numChildren || 0)
                  ? `, TE ${booking.numChildren}`
                  : ""
              })`}
            />
            <InfoPill
              icon={<MapPin size={16} />}
              text={destination}
            />
            <InfoPill icon={<Calendar size={16} />} text={startDate} />
            <InfoPill
              icon={<Clock size={16} />}
              text={time}
            />
          </div>

          {/* actions */}
          <div className="mt-1 flex flex-wrap items-center gap-10">
            {tourId && (
              <Link
                href={`/user/destination/${destination?.toLowerCase().replace(/\s+/g, "-")}/${tourId}`}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600"
              >
                Xem tour
              </Link>
            )}

            <div className="ml-auto flex items-center gap-8">
              {/* Thanh toán cọc / đủ — chỉ khi đang chờ hoặc sắp khởi hành */}
              {(status === "pending" || status === "upcoming") &&
                remain > 0 && tourId && (
                  <Link
                    href={`/user/checkout?id=${tourId}`}
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                  >
                    {status === "pending" ? "Thanh toán cọc" : "Thanh toán"}
                  </Link>
                )}

              {/* Huỷ đơn — chỉ khi pending */}
              {status === "pending" && (
                <button
                  onClick={onCancel}
                  className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  <XCircle size={16} className="mr-2" /> Hủy đơn
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- small atoms ---------- */
function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <span className="text-slate-700">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-semibold text-emerald-700">{value}</span>
    </div>
  );
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span className="text-slate-600">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
