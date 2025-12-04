"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Users, Package, MapPin, Send, Clock, User as UserIcon } from "lucide-react";
import {
  getAllSupportChats,
  getAllBookingChats,
  getAllTourChats,
  getSupportMessages,
  getBookingMessages,
  getTourGroupMessages,
  sendSupportMessage,
  sendBookingMessage,
  sendTourGroupMessage,
  type ChatMessage,
} from "@/lib/chat/chatApi";

type ChatTab = "support" | "booking" | "tour";

type ChatThread = {
  id: string;
  type: ChatTab;
  title: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
};

export default function AdminChatPage() {
  const [activeTab, setActiveTab] = useState<ChatTab>("support");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadThreads();
  }, [activeTab]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      let response: any;

      switch (activeTab) {
        case "support":
          response = await getAllSupportChats();
          setThreads(
            response.data.map((item: any) => ({
              id: item.supportId,
              type: "support" as ChatTab,
              title: `${item.name || item.email || "Khách"} - ${item.supportId}`,
              lastMessage: item.lastMessage,
              lastTime: item.lastTime,
            }))
          );
          break;
        case "booking":
          response = await getAllBookingChats();
          setThreads(
            response.data.map((item: any) => ({
              id: item.bookingCode,
              type: "booking" as ChatTab,
              title: `Booking ${item.bookingCode} - ${item.tourTitle || "Tour"}`,
              lastMessage: item.lastMessage,
              lastTime: item.lastTime,
            }))
          );
          break;
        case "tour":
          response = await getAllTourChats();
          setThreads(
            response.data.map((item: any) => ({
              id: item.tourId,
              type: "tour" as ChatTab,
              title: `Tour: ${item.tourTitle || item.tourId}`,
              lastMessage: item.lastMessage,
              lastTime: item.lastTime,
            }))
          );
          break;
      }
    } catch (err) {
      console.error("Error loading threads:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (thread: ChatThread) => {
    try {
      setLoading(true);
      let response;

      switch (thread.type) {
        case "support":
          response = await getSupportMessages(thread.id);
          break;
        case "booking":
          response = await getBookingMessages(thread.id);
          break;
        case "tour":
          response = await getTourGroupMessages(thread.id);
          break;
      }

      setMessages(response.data);
      setSelectedThread(thread);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    try {
      setSending(true);
      let response;

      switch (selectedThread.type) {
        case "support":
          response = await sendSupportMessage(selectedThread.id, {
            content: newMessage.trim(),
          });
          break;
        case "booking":
          response = await sendBookingMessage(selectedThread.id, newMessage.trim());
          break;
        case "tour":
          response = await sendTourGroupMessage(selectedThread.id, newMessage.trim());
          break;
      }

      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chat</h1>
          <p className="text-gray-600 mt-1">Hỗ trợ khách hàng và quản lý cuộc trò chuyện</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Chat List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => {
                      setActiveTab("support");
                      setSelectedThread(null);
                      setMessages([]);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "support"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Hỗ trợ
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("booking");
                      setSelectedThread(null);
                      setMessages([]);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "booking"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Booking
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("tour");
                      setSelectedThread(null);
                      setMessages([]);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "tour"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Tour
                  </button>
                </div>
              </div>

              {/* Thread List */}
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {loading && !selectedThread ? (
                  <div className="p-4 text-center text-gray-500">Đang tải...</div>
                ) : threads.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Chưa có cuộc trò chuyện</div>
                ) : (
                  threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => loadMessages(thread)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedThread?.id === thread.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{thread.title}</p>
                          {thread.lastMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {thread.lastMessage}
                            </p>
                          )}
                        </div>
                        {thread.unread && thread.unread > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                      {thread.lastTime && (
                        <p className="text-xs text-gray-400 mt-1">{formatTime(thread.lastTime)}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Messages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {selectedThread ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="font-semibold text-gray-900">{selectedThread.title}</h2>
                    <p className="text-sm text-gray-500">ID: {selectedThread.id}</p>
                  </div>

                  {/* Messages */}
                  <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-500 mt-2">Đang tải tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Chưa có tin nhắn nào</div>
                    ) : (
                      messages.map((msg) => {
                        const isAdmin = msg.fromRole === "admin";
                        const isSystem = msg.isSystem;

                        if (isSystem) {
                          return (
                            <div key={msg._id} className="text-center">
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] ${
                                isAdmin
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              } rounded-lg p-4`}
                            >
                              {!isAdmin && (
                                <div className="flex items-center gap-2 mb-2">
                                  <UserIcon className="w-4 h-4" />
                                  <span className="font-semibold text-sm">
                                    {msg.name || msg.email || msg.fromRole}
                                  </span>
                                </div>
                              )}
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div
                                className={`flex items-center gap-1 mt-2 text-xs ${
                                  isAdmin ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send Message Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="border-t border-gray-200 p-4 bg-gray-50"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập tin nhắn..."
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Gửi
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
