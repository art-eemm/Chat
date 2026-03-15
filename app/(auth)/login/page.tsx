"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      const { error: sessionError } = await supabaseClient.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        throw new Error("Error guardando la sesión en el navegador");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Iniciar sesión
        </CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href={"/forgot-password"}
                className="text-xs font-medium text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Iniciando..." : "Ingresar"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link
              href={"/register"}
              className="font-medium text-primary hover:underline"
            >
              Regístrate aquí
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

          <Button variant={"outline"} className="w-full" asChild>
            <a href="/chat-app.apk" download={"ChatApp.apk"}>
              <Download className="mr-2 h-4 w-4" />
              Descargar APK para Android
            </a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
