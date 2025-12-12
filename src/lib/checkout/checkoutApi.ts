import axiosInstance from "@/lib/axiosInstance";

/** ================= Types (khớp BE) ================= */
export type PaymentMethod = "office-payment" | "paypal-payment" | "momo-payment" | "vnpay-payment" | "deposit";

export type CreateBookingBody = {
  tourId: string;
  contact: { fullName: string; phone: string; email: string; address?: string };
  guests: { adults: number; children: number };
  pricing: { priceAdult: number; priceChild: number; total?: number };
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
};

export type CreateBookingResponse = {
  code: string;                       // booking code (BKxxxxxx)
  status: "p" | "c" | "x" | "f";
  payment?: { redirectUrl?: string | null } | null;
  total?: number;
};

export type MyBookingItem = {
  code: string;
  tourId: string;
  tourTitle?: string | null;
  tourImage?: string | null;
  tourDestination?: string | null;
  time?: string | null;
  startDate?: string | null;
  endDate?: string | null;

  numAdults: number;
  numChildren: number;

  totalPrice: number;
  paidAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  requireFullPayment?: boolean;

  bookingStatus: "p" | "c" | "x" | "f";
  createdAt?: string;
};

export type MyBookingList = {
  total: number;
  page: number;
  limit: number;
  data: MyBookingItem[];
};

/** =============== Adapters ================= */
function adaptCreateBooking(res: any): CreateBookingResponse {
  return {
    code: String(res?.booking?.code ?? res?.code ?? ""),
    status: (res?.booking?.bookingStatus ?? res?.status ?? "p") as any,
    payment: res?.payment ?? 
      (res?.payUrl || res?.deeplink
        ? { redirectUrl: res?.payUrl ?? res?.deeplink }
        : null),
    total: Number(res?.booking?.totalPrice ?? res?.total ?? 0),
  };
}

function adaptMyBookings(res: any): MyBookingList {
  const rows = Array.isArray(res?.data) ? res.data : [];
  const mapped = rows.map((b: any): MyBookingItem => {
    // Backend populates tourId as an object, not a string
    const tour = typeof b.tourId === 'object' ? b.tourId : null;
    const tourIdStr = typeof b.tourId === 'object' ? String(b.tourId?._id ?? '') : String(b.tourId ?? '');
    
    return {
      code: b.code,
      tourId: tourIdStr,
      tourTitle: tour?.title ?? b.tourTitle ?? null,
      tourImage: tour?.cover ?? tour?.images?.[0] ?? b.tourImage ?? null,
      tourDestination: tour?.destination ?? b.destination ?? null,
      time: tour?.time ?? null,
      startDate: tour?.startDate ?? null,
      endDate: tour?.endDate ?? null,

      numAdults: Number(b.numAdults ?? 0),
      numChildren: Number(b.numChildren ?? 0),

      totalPrice: Number(b.totalPrice ?? 0),
      paidAmount: Number(b.paidAmount ?? 0),
      depositAmount: Number(b.depositAmount ?? 0),
      depositPaid: Boolean(b.depositPaid),
      requireFullPayment: Boolean(b.requireFullPayment),

      bookingStatus: b.bookingStatus ?? "p",
      createdAt: b.createdAt,
    };
  });
  return {
    total: Number(res?.total ?? mapped.length),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? (mapped.length || 10)),
    data: mapped,
  };
}

/** ================= Public ================= */
export async function getCheckoutQuote(payload: {
  tourId: string;
  guests: { adults: number; children: number };
  pricing: { priceAdult: number; priceChild: number };
  couponCode: string | null;
}) {
  const { data } = await axiosInstance.post("/bookings/quote", payload);
  return data;
}

/** ================= User APIs ================= */
export async function createBooking(body: CreateBookingBody): Promise<CreateBookingResponse> {
  const { data } = await axiosInstance.post("/bookings", body, { timeout: 20000 });
  return adaptCreateBooking(data);
}

export async function getMyBookings(page = 1, limit = 10): Promise<MyBookingList> {
  const { data } = await axiosInstance.get("/bookings/me", { params: { page, limit } });
  return adaptMyBookings(data);
}

export async function cancelBooking(code: string): Promise<{ ok: boolean }> {
  const { data } = await axiosInstance.put(`/bookings/${encodeURIComponent(code)}/cancel`);
  return { ok: Boolean(data?.message === "Canceled" || data?.ok || true) };
}

/** Re-init payment cho 1 booking (cọc/remaining) */
export async function createPaymentForBooking(
  code: string,
  type: "deposit" | "remaining"
): Promise<{ payUrl?: string; deeplink?: string }> {
  const { data } = await axiosInstance.post(
    `/bookings/${encodeURIComponent(code)}/payment`,
    { type }
  );
  return data || {};
}

export async function initBookingPayment(code: string): Promise<{ payUrl?: string; deeplink?: string }> {
  const { data } = await axiosInstance.post(`/bookings/${encodeURIComponent(code)}/pay`, {});
  return data;
}

/** Create VNPay payment URL for existing booking */
export async function createVNPayPayment(
  code: string,
  type: "deposit" | "remaining" = "remaining"
): Promise<{ payUrl?: string; amount?: number }> {
  const { data } = await axiosInstance.post("/payment/vnpay/create-payment", { code, type });
  return data || {};
}

/** Create MoMo payment URL for remaining amount */
export async function createMoMoPayment(
  code: string
): Promise<{ payUrl?: string; remain?: number }> {
  const { data } = await axiosInstance.post("/payment/momo/create-remaining", { code });
  return data || {};
}