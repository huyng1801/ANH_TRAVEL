import axiosInstance from "@/lib/axiosInstance";

export type ChatMessage = {
  _id: string;
  roomType: "booking" | "support" | "tour";
  bookingCode?: string;
  supportId?: string;
  tourId?: string;
  fromId?: string;
  fromRole: "admin" | "leader" | "user" | "guest";
  name?: string;
  email?: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatResponse = {
  roomType?: string;
  bookingCode?: string;
  supportId?: string;
  tourId?: string;
  total: number;
  data: ChatMessage[];
};

export type StartSupportResponse = {
  message: string;
  supportId: string;
  firstMessage: ChatMessage;
};

// ==================== Booking Chat ====================
export async function getBookingMessages(bookingCode: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/booking/${bookingCode}`);
  return data;
}

export async function sendBookingMessage(bookingCode: string, content: string): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/booking/${bookingCode}`, { content });
  return data;
}

// ==================== Support Chat ====================
export async function startSupportChat(params: {
  content: string;
  name?: string;
  email?: string;
}): Promise<StartSupportResponse> {
  const { data } = await axiosInstance.post("/chat/support/start", params);
  return data;
}

export async function getSupportMessages(supportId: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/support/${supportId}`);
  return data;
}

export async function sendSupportMessage(
  supportId: string,
  params: { content: string; name?: string; email?: string }
): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/support/${supportId}`, params);
  return data;
}

// ==================== Tour Group Chat ====================
export async function getTourGroupMessages(tourId: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/tour/${tourId}`);
  return data;
}

export async function sendTourGroupMessage(tourId: string, content: string): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/tour/${tourId}`, { content });
  return data;
}

// ==================== Admin APIs ====================
export async function getAllSupportChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/support");
  return data;
}

export async function getAllBookingChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/bookings");
  return data;
}

export async function getAllTourChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/tours");
  return data;
}
