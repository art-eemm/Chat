"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(
          data.message ||
            "Si el correo existe, recibirás una nueva contraseña.",
        );
        setEmail("");
      } else {
        setError(data.error || "Ocurrió un error al procesar tu solicitud.");
      }
    } catch (err) {
      setError("Error de conexión. Por favor, intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Recuperar contraseña
        </CardTitle>
        <CardDescription>
          Ingresa tu correo y te enviaremos una nueva contraseña
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive text-center">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400 text-center">
              {message}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Recuperar contraseña"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <Link
              href={"/login"}
              className="font-medium text-primary hover:underline inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Regresar
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
