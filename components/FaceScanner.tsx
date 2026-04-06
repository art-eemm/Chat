"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "./ui/button";

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array) => void;
  onCancel: () => void;
}

export function FaceScanner({ onFaceDetected, onCancel }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState("Cargando IA...");

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setIsModelLoaded(true);
        startCamera();
      } catch (error) {
        setStatus("Error al cargar los modelos de IA");
        console.error(error);
      }
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          setStatus("Iniciando cámara...");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStatus("Posiciónate frente a la cámara");
          }
        } catch (err) {
          setStatus("Error al acceder a la cámara");
        }
      }
    };

    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    if (!videoRef.current || !isModelLoaded) return;

    setStatus("Analizando rostro...");

    const detection = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      setStatus("Rsotro detectado");
      onFaceDetected(detection.descriptor);
    } else {
      setStatus("No se detectó un rostro claro. Intenta de nuevo");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-background">
      <p className="text-sm font-medium text-center">{status}</p>
      <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
          onPlay={() => setStatus("Cámara lista. Haz clic en Escanear")}
        />
      </div>
      <div className="flex gap-2 w-full">
        <Button onClick={onCancel} variant={"outline"} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handleScan}
          className="flex-1"
          disabled={!isModelLoaded}
        >
          Escanear Rostro
        </Button>
      </div>
    </div>
  );
}
