"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function RegisterPage() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsusario] = useState("");
  const [email, setEmail] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!foto) {
      setError("Por favor selecciona una foto de perfil");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nombre_usuario", nombreUsuario);
      formData.append("email", email);
      formData.append("foto", foto);

      const res = await fetch("/api/usuarios/registro", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el usuario");
      }

      setSuccess(data.message);

      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
          Crear una cuenta
        </CardTitle>
        <CardDescription>
          Ingresa tus datos. Te enviaremos tu contraseña por correo.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-md text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-100/50 rounded-md text-center">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Usuario</Label>
            <Input
              id="name"
              type="text"
              placeholder=""
              required
              value={nombreUsuario}
              onChange={(e) => setNombreUsusario(e.target.value)}
              disabled={loading || !!success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto">Foto de Perfil</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              disabled={loading || !!success}
              className="cursor-pointer"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !!success}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href={"/login"}
              className="font-medium text-primary hover:underline"
            >
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
