"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LogOut,
  Settings,
  User,
  Camera,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "../ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface Perfil {
  nombre_usuario?: string;
  [key: string]: any;
}

export function UserMenu() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        const { data } = await supabaseClient
          .from("perfiles")
          .select("*")
          .eq("id_perfil", user.id)
          .single();

        if (data) setPerfil(data);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }

      await supabaseClient.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const iniciales = perfil?.nombre_usuario
    ? perfil.nombre_usuario.substring(0, 2).toUpperCase()
    : "YO";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none focus:ring-2 focus:ring-primary rounded-full">
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage
                src={perfil?.foto_url || ""}
                alt={perfil?.nombre_usuario || "Mi Perfil"}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {iniciales}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {perfil?.nombre_usuario || "Cargando..."}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {perfil?.correo || ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsProfileOpen(true)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Ajustes</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Apariencia</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Claro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Oscuro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer"
                >
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configuración del Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal o cambia tu contraseña
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={perfil?.foto_url || ""}
                      alt={perfil?.nombre_usuario}
                    />
                    <AvatarFallback className="text-2xl">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size={"icon"}
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Haz clic para cambiar tu foto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre visible</Label>
                <Input id="name" defaultValue={perfil?.nombre_usuario || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Estado</Label>
                <Input id="bio" defaultValue={perfil?.biografia || ""} />
              </div>
              <Button className="w-full mt-2">Guardar cambios</Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="w-full mt-2">Actualizar contraseña</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
