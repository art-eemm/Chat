"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Fingerprint, ScanFace } from "lucide-react";
import { NativeBiometric } from "capacitor-native-biometric";
import { FaceScanner } from "@/components/FaceScanner";
import * as faceapi from "face-api.js";
import { Capacitor } from "@capacitor/core";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  const [showFaceScanner, setShowFaceScanner] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      if (typeof window !== "undefined" && window.hasOwnProperty("Capacitor")) {
        try {
          const result = await NativeBiometric.isAvailable();
          if (result.isAvailable) {
            setIsBiometricAvailable(true);

            try {
              await NativeBiometric.getCredentials({ server: "chat-app-auth" });
              setHasSavedCredentials(true);
            } catch (err) {}
          }
        } catch (error) {
          console.error("Error comprobando biometría:", error);
        }
      }
    };
    checkBiometrics();
  }, []);

  const handleBiometricLogin = async () => {
    setError(null);
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Para acceder a tus chats de forma segura",
        title: "Inicio de Sesión",
        subtitle: "Usa tu huella o rostro",
      });

      setLoading(true);

      const credentials = await NativeBiometric.getCredentials({
        server: "chat-app-auth",
      });

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      await supabaseClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (err.message && !err.message.includes("cancel")) {
        setError("Error de autenticación biométrica");
      }
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      await supabaseClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (isBiometricAvailable) {
        try {
          await NativeBiometric.setCredentials({
            username: email,
            password: password,
            server: "chat-app-auth",
          });
        } catch (bioError) {
          console.error(
            "No se pudieron guardar las credenciales biométricas",
            bioError,
          );
        }
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async (liveDescriptor: Float32Array) => {
    try {
      setLoading(true);
      setError(null);

      const { data: perfil } = await supabaseClient
        .from("perfiles")
        .select("rostro_descriptor")
        .eq("correo", email)
        .single();

      if (!perfil || !perfil.rostro_descriptor) {
        throw new Error(
          "No hay un rostro registrado para este correo o el usuario no existe",
        );
      }

      const storedDescriptorArray = new Float32Array(
        JSON.parse(perfil.rostro_descriptor),
      );
      const distance = faceapi.euclideanDistance(
        liveDescriptor,
        storedDescriptorArray,
      );

      if (distance < 0.5) {
        const res = await fetch("/api/auth/login-facial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error del servidor:", res.status, errorText);
          throw new Error(
            `Error ${res.status}: Revisa la consola para más detalles`,
          );
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error del servidor");

        window.location.href = data.action_link;
      } else {
        throw new Error(
          "El rostro no coincide con el registrado. Intenta de nuevo.",
        );
      }
    } catch (err: any) {
      setError(err.message);
      setShowFaceScanner(false);
    } finally {
      setLoading(false);
    }
  };

  if (showFaceScanner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
        <FaceScanner
          onFaceDetected={handleFaceLogin}
          onCancel={() => setShowFaceScanner(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Bienvenido de nuevo
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Si el usuario ya tiene credenciales guardadas, mostramos el botón grande biométrico */}
          {hasSavedCredentials && (
            <div className="mb-6 space-y-4">
              <Button
                type="button"
                onClick={handleBiometricLogin}
                className="w-full h-14 text-lg"
                variant="default"
                disabled={loading}
              >
                <Fingerprint className="mr-2 h-6 w-6" />
                Ingresar con Huella / Face ID
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O usa tu contraseña
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              variant={hasSavedCredentials ? "outline" : "default"}
            >
              {loading ? "Iniciando sesión..." : "Ingresar con correo"}
            </Button>

            <Button
              type="button"
              className="w-full"
              variant={"secondary"}
              disabled={loading}
              onClick={() => {
                if (!email) {
                  setError(
                    "Primero escribe tu correo electrónico para buscar tu perfil",
                  );
                  return;
                }
                setShowFaceScanner(true);
              }}
            >
              <ScanFace className="mr-2 h-4 w-4" />
              Ingresar con Rostro (Web)
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Regístrate
            </Link>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O lleva el chat contigo
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a href="app-debug.apk" download="ChatApp.apk">
              <Download className="mr-2 h-4 w-4" />
              Descargar APK para Android
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
