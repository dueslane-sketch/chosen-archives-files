"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCall } from "@/components/CallProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, Video, PhoneOff } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Import the centralized supabase client
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const CallPage = () => {
  const {
    peerId,
    localStream,
    remoteStream,
    callUser,
    endCall,
    currentCall,
    isCalling,
    incomingCall,
    answerCall,
    rejectCall,
  } = useCall();
  const [remotePeerIdInput, setRemotePeerIdInput] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime for Chat
  useEffect(() => {
    if (!peerId || !currentCall || !supabase) {
      if (!supabase) {
        toast.error("Supabase client not initialized. Check your .env.local file.");
      }
      return;
    }

    const channel = supabase.channel(`chat_${peerId}_${currentCall.peer}`);

    const handleNewMessage = (payload: { new: Message }) => {
      setMessages((prev) => [...prev, payload.new]);
    };

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handleNewMessage)
      .subscribe();

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${peerId},receiver_id.eq.${currentCall.peer}),and(sender_id.eq.${currentCall.peer},receiver_id.eq.${peerId})`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load chat messages.");
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [peerId, currentCall]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !peerId || !currentCall || !supabase) {
      if (!supabase) {
        toast.error("Supabase client not initialized. Cannot send message.");
      }
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: peerId,
      receiver_id: currentCall.peer,
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    } else {
      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Real-time Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium">Your Peer ID: {peerId || "Loading..."}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share this ID with someone to connect.
            </p>
          </div>

          {!isCalling && !incomingCall && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Input
                type="text"
                placeholder="Enter remote Peer ID"
                value={remotePeerIdInput}
                onChange={(e) => setRemotePeerIdInput(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => callUser(remotePeerIdInput, false)}
                  disabled={!peerId || !remotePeerIdInput}
                >
                  <Phone className="mr-2 h-4 w-4" /> Audio Call
                </Button>
                <Button
                  onClick={() => callUser(remotePeerIdInput, true)}
                  disabled={!peerId || !remotePeerIdInput}
                >
                  <Video className="mr-2 h-4 w-4" /> Video Call
                </Button>
              </div>
            </div>
          )}

          {incomingCall && (
            <div className="text-center p-4 border rounded-md bg-blue-50 dark:bg-blue-900">
              <p className="text-lg font-semibold mb-2">
                Incoming call from {incomingCall.peer}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => answerCall(false)} variant="secondary">
                  <Phone className="mr-2 h-4 w-4" /> Answer Audio
                </Button>
                <Button onClick={() => answerCall(true)}>
                  <Video className="mr-2 h-4 w-4" /> Answer Video
                </Button>
                <Button onClick={rejectCall} variant="destructive">
                  <PhoneOff className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}

          {(isCalling || currentCall) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center space-y-2">
                <h3 className="text-xl font-semibold">Your Video</h3>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="w-full h-64 bg-black rounded-md object-cover"
                />
              </div>
              <div className="flex flex-col items-center space-y-2">
                <h3 className="text-xl font-semibold">Remote Video</h3>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-full h-64 bg-black rounded-md object-cover"
                />
              </div>
            </div>
          )}

          {(isCalling || currentCall) && (
            <div className="flex justify-center">
              <Button onClick={endCall} variant="destructive">
                <PhoneOff className="mr-2 h-4 w-4" /> End Call
              </Button>
            </div>
          )}

          {(isCalling || currentCall) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Chat with{" "}
                  {currentCall?.peer || "..."}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full rounded-md border p-4 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500">No messages yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-2 ${
                          msg.sender_id === peerId
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        <span
                          className={`inline-block p-2 rounded-lg ${
                            msg.sender_id === peerId
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                          }`}
                        >
                          {msg.content}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit">Send</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CallPage;