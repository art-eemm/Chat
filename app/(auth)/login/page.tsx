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

export default function LoginPage() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Iniciar sesión
        </CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
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
          <Input id="password" type="password" required />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 mt-2">
        <Button className="w-full" asChild>
          <Link href={"/"}>Ingresar</Link>
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
      </CardFooter>
    </Card>
  );
}
