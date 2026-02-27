"use client";

import { useState } from "react";
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

export function UserMenu() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { setTheme } = useTheme();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none focus:ring-2 focus:ring-primary rounded-full">
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={""} alt="Mi Perfil" />
              <AvatarFallback className="bg-primary/10 text-primary">
                YO
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Perfil</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsProfileOpen(true)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
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
          <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
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
                    <AvatarFallback className="text-2xl">YO</AvatarFallback>
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
                <Input id="name" defaultValue={"Mi Nombre"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Estado</Label>
                <Input id="bio" defaultValue={"Disponible"}></Input>
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
