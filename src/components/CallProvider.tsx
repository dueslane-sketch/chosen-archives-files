"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Peer from "peerjs";
import { toast } from "sonner";

interface CallContextType {
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callUser: (remotePeerId: string, isVideoCall: boolean) => void;
  endCall: () => void;
  currentCall: Peer.MediaConnection | null;
  isCalling: boolean;
  incomingCall: Peer.MediaConnection | null;
  answerCall: (isVideoCall: boolean) => void;
  rejectCall: () => void;
}

export const CallContext = createContext<CallContextType | undefined>(
  undefined,
);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentCall, setCurrentCall] = useState<Peer.MediaConnection | null>(
    null,
  );
  const [incomingCall, setIncomingCall] = useState<Peer.MediaConnection | null>(
    null,
  );
  const [isCalling, setIsCalling] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const getMediaStream = useCallback(
    async (isVideoCall: boolean): Promise<MediaStream | null> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access camera/microphone.");
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    const newPeer = new Peer(); // Uses default PeerJS server

    newPeer.on("open", (id) => {
      setPeerId(id);
      toast.success(`Your Peer ID: ${id}. Share it to receive calls.`);
    });

    newPeer.on("call", async (call) => {
      setIncomingCall(call);
      toast.info(`Incoming call from ${call.peer}`);
    });

    newPeer.on("error", (err) => {
      console.error("PeerJS error:", err);
      toast.error(`PeerJS error: ${err.message}`);
    });

    setPeer(newPeer);

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      newPeer.destroy();
    };
  }, []);

  const answerCall = useCallback(
    async (isVideoCall: boolean) => {
      if (!incomingCall || !peer) return;

      const stream = await getMediaStream(isVideoCall);
      if (!stream) {
        rejectCall();
        return;
      }

      incomingCall.answer(stream);
      setCurrentCall(incomingCall);
      setIsCalling(true);
      setIncomingCall(null);

      incomingCall.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
        toast.success(`Call established with ${incomingCall.peer}`);
      });

      incomingCall.on("close", () => {
        endCall();
        toast.info(`Call with ${incomingCall.peer} ended.`);
      });

      incomingCall.on("error", (err) => {
        console.error("Call error:", err);
        toast.error(`Call error: ${err.message}`);
        endCall();
      });
    },
    [incomingCall, peer, getMediaStream],
  );

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
      toast.info(`Call from ${incomingCall.peer} rejected.`);
    }
  }, [incomingCall]);

  const callUser = useCallback(
    async (remotePeerId: string, isVideoCall: boolean) => {
      if (!peer || !remotePeerId || remotePeerId === peerId) {
        toast.error("Invalid remote Peer ID or cannot call yourself.");
        return;
      }

      const stream = await getMediaStream(isVideoCall);
      if (!stream) return;

      const call = peer.call(remotePeerId, stream);
      setCurrentCall(call);
      setIsCalling(true);
      toast.loading(`Calling ${remotePeerId}...`);

      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
        toast.dismiss();
        toast.success(`Call established with ${remotePeerId}`);
      });

      call.on("close", () => {
        endCall();
        toast.info(`Call with ${remotePeerId} ended.`);
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        toast.error(`Call error: ${err.message}`);
        endCall();
      });
    },
    [peer, peerId, getMediaStream],
  );

  const endCall = useCallback(() => {
    if (currentCall) {
      currentCall.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCurrentCall(null);
    setIncomingCall(null);
    setIsCalling(false);
    localStreamRef.current = null; // Clear the ref
  }, [currentCall]);

  const value = {
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
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = React.useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};