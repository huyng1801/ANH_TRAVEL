"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "#/stores/auth";
import { MessageCircle, Send, X, Minimize2, User, Clock } from "lucide-react";
import {
  startSupportChat,
  getSupportMessages,
  sendSupportMessage,
  type ChatMessage,
} from "@/lib/chat/chatApi";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [supportId, setSupportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showStartForm, setShowStartForm] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  useEffect(() => {
    const savedSupportId = localStorage.getItem("supportChatId");
    if (savedSupportId) {
      setSupportId(savedSupportId);
      setShowStartForm(false);
      loadMessages(savedSupportId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (sid: string) => {
    try {
      setLoading(true);
      const response = await getSupportMessages(sid);
      setMessages(response.data);
      if (!isOpen) {
        const lastMsg = response.data[response.data.length - 1];
        if (lastMsg?.fromRole === "admin") {
          setUnreadCount((prev) => prev + 1);
        }
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      if (err.response?.status === 404) {
        localStorage.removeItem("supportChatId");
        setSupportId(null);
        setShowStartForm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await startSupportChat({
        content: newMessage.trim(),
        name: isLoggedIn ? undefined : name,
        email: isLoggedIn ? undefined : email,
      });

      setSupportId(response.supportId);
      localStorage.setItem("supportChatId", response.supportId);
      setMessages([response.firstMessage]);
      setNewMessage("");
      setShowStartForm(false);
    } catch (err: any) {
      console.error("Error starting chat:", err);
      alert(err.response?.data?.message || "Không thể bắt đầu chat");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !supportId) return;

    try {
      setSending(true);
      const response = await sendSupportMessage(supportId, {
        content: newMessage.trim(),
        name: isLoggedIn ? undefined : name,
        email: isLoggedIn ? undefined : email,
      });

      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
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
    <>
      {/* Floating Button */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Box */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
                {supportId && <p className="text-xs text-blue-100">ID: {supportId}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMinimize}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showStartForm ? (
            // Start Chat Form
            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="font-semibold mb-3 text-gray-900">Bắt đầu cuộc trò chuyện</h4>
              <form onSubmit={handleStartChat} className="space-y-3">
                {!isLoggedIn && (
                  <>
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tên của bạn"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Email"
                      />
                    </div>
                  </>
                )}
                <div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Nhập câu hỏi..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm"
                >
                  {sending ? "Đang gửi..." : "Bắt đầu chat"}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-96">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">Chưa có tin nhắn</div>
                ) : (
                  messages.map((msg) => {
                    const isFromMe = msg.fromRole === "user" || msg.fromRole === "guest";
                    const isAdmin = msg.fromRole === "admin";

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] ${
                            isFromMe
                              ? "bg-blue-600 text-white"
                              : isAdmin
                              ? "bg-green-100 text-gray-900"
                              : "bg-gray-100 text-gray-900"
                          } rounded-lg p-3`}
                        >
                          {!isFromMe && (
                            <div className="flex items-center gap-1 mb-1">
                              <User className="w-3 h-3" />
                              <span className="font-semibold text-xs">
                                {msg.name || "Hỗ trợ"}
                              </span>
                              {isAdmin && (
                                <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isFromMe ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tin nhắn..."
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {supportId && (
                <div className="p-2 text-center border-t border-gray-200">
                  <button
                    onClick={() => {
                      localStorage.removeItem("supportChatId");
                      setSupportId(null);
                      setMessages([]);
                      setShowStartForm(true);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Bắt đầu cuộc trò chuyện mới
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
