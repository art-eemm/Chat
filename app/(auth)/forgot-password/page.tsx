import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@gmail.com"
            required
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 mt-2">
        <Button className="w-full">Enviar enlace de recuperación</Button>

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
    </Card>
  );
}
