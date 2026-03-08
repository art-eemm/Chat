"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LogOut,
  Settings,
  Camera,
  Sun,
  Moon,
  Laptop,
  Loader2,
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

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [biografia, setBiografia] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [generalSucces, setGeneralSucces] = useState("");
  const [isUpdatingGeneral, setIsUpdatingGeneral] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  const handleUpdateGeneral = async () => {
    setGeneralError("");
    setGeneralSucces("");
    setIsUpdatingGeneral(true);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/perfil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario,
          biografia: biografia,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneralSucces("Perfil actualizado correctamente.");
        if (data.perfil) {
          setPerfil(data.perfil);
        }
      } else {
        setGeneralError(data.error || "Error al actualizar el perfil.");
      }
    } catch (error) {
      setGeneralError("Ocurrió un error inesperado al actualizar.");
    } finally {
      setIsUpdatingGeneral(false);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida.");
      return;
    }

    setIsUploadingFoto(true);
    setGeneralError("");
    setGeneralSucces("");

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append("foto", file);

      const response = await fetch("/api/perfil/foto", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setGeneralSucces("Foto actualizada correctamente.");
        setPerfil((prev) =>
          prev ? { ...prev, foto_url: data.foto_url } : prev,
        );
      } else {
        setGeneralError(data.error || "Error al subir la foto.");
      }
    } catch (error) {
      setGeneralError("Ocurrió un error inesperado al subir la foto.");
    } finally {
      setIsUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError("Hubo un error: " + error.message);
      } else {
        setPasswordSuccess("Contraseña actualizada correctamente.");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setPasswordError("Ocurrió un error inesperado al actualizar.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (!isProfileOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordSuccess("");
      setGeneralError("");
      setGeneralSucces("");
      if (perfil) {
        setNombreUsuario(perfil.nombre_usuario || "");
        setBiografia(perfil.biografia || "");
      }
    }
  }, [isProfileOpen, perfil]);

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
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFotoChange}
                  />
                  <Avatar
                    className={`h-24 w-24 ${isUploadingFoto ? "opacity-50" : ""}`}
                  >
                    <AvatarImage
                      src={perfil?.foto_url || ""}
                      alt={perfil?.nombre_usuario}
                    />
                    <AvatarFallback className="text-2xl">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>

                  {isUploadingFoto ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : null}

                  <Button
                    size={"icon"}
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFoto}
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
                <Input
                  id="name"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Nombre de usuario"
                  defaultValue={perfil?.nombre_usuario || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Estado</Label>
                <Input
                  id="bio"
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder="¿Qué estás pensando?"
                  defaultValue={perfil?.biografia || ""}
                />
              </div>

              {generalError && (
                <p className="text-sm font-medium text-destructive">
                  {generalError}
                </p>
              )}
              {generalSucces && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {generalSucces}
                </p>
              )}
              <Button
                className="w-full mt-2"
                onClick={handleUpdateGeneral}
                disabled={
                  isUpdatingGeneral || isUploadingFoto || !nombreUsuario.trim()
                }
              >
                {isUpdatingGeneral ? "Guardando..." : "Guardar cambios"}
              </Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              {passwordError && (
                <p className="text-sm font-medium text-destructive">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {passwordSuccess}
                </p>
              )}
              <Button
                className="w-full mt-2"
                onClick={handleUpdatePassword}
                disabled={
                  isUpdatingPassword || !newPassword || !confirmPassword
                }
              >
                {isUpdatingPassword ? "Actualizando" : "Actualizar contraseña"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
