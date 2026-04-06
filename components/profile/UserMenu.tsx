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
  ScanFace,
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
import { FaceScanner } from "../FaceScanner";

export function UserMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [biografia, setBiografia] = useState("");
  const [generalMsg, setGeneralMsg] = useState({ text: "", type: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [securityMsg, setSecurityMsg] = useState({ text: "", type: "" });
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);

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

  useEffect(() => {
    if (!isProfileOpen) {
      setPasswords({ new: "", confirm: "" });
      setGeneralMsg({ text: "", type: "" });
      setSecurityMsg({ text: "", type: "" });
      setIsRegisteringFace(false);
      if (perfil) {
        setNombreUsuario(perfil.nombre_usuario || "");
        setBiografia(perfil.biografia || "");
      }
    }
  }, [isProfileOpen, perfil]);

  const handleLogout = async () => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (session) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
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
    setGeneralMsg({ text: "", type: "" });
    setIsUpdating(true);
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
        body: JSON.stringify({ nombre_usuario: nombreUsuario, biografia }),
      });
      const data = await response.json();
      if (response.ok) {
        setGeneralMsg({
          text: "Perfil actualizado correctamente.",
          type: "success",
        });
        if (data.perfil) setPerfil(data.perfil);
      } else {
        setGeneralMsg({
          text: data.error || "Error al actualizar.",
          type: "error",
        });
      }
    } catch (error) {
      setGeneralMsg({ text: "Error inesperado.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/"))
      return alert("Selecciona una imagen válida.");

    setIsUploadingFoto(true);
    setGeneralMsg({ text: "", type: "" });

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;
      const formData = new FormData();
      formData.append("foto", file);
      const response = await fetch("/api/perfil/foto", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setGeneralMsg({ text: "Foto actualizada.", type: "success" });
        setPerfil((prev: any) =>
          prev ? { ...prev, foto_url: data.foto_url } : prev,
        );
      } else {
        setGeneralMsg({
          text: data.error || "Error al subir la foto.",
          type: "error",
        });
      }
    } catch (error) {
      setGeneralMsg({ text: "Error inesperado al subir foto.", type: "error" });
    } finally {
      setIsUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdatePassword = async () => {
    setSecurityMsg({ text: "", type: "" });
    if (passwords.new.length < 6)
      return setSecurityMsg({ text: "Mínimo 6 caracteres.", type: "error" });
    if (passwords.new !== passwords.confirm)
      return setSecurityMsg({
        text: "Las contraseñas no coinciden.",
        type: "error",
      });

    setIsUpdating(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: passwords.new,
      });
      if (error) setSecurityMsg({ text: error.message, type: "error" });
      else {
        setSecurityMsg({ text: "Contraseña actualizada.", type: "success" });
        setPasswords({ new: "", confirm: "" });
      }
    } catch (error) {
      setSecurityMsg({ text: "Error inesperado.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Lógica de Registro Facial
  const handleFaceRegistration = async (descriptor: Float32Array) => {
    setSecurityMsg({ text: "Guardando rostro...", type: "success" });
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const descriptorString = JSON.stringify(Array.from(descriptor));
      const { error } = await supabaseClient
        .from("perfiles")
        .update({ rostro_descriptor: descriptorString })
        .eq("id_perfil", session.user.id);

      if (error) throw error;
      setSecurityMsg({
        text: "Rostro registrado. Ya puedes iniciar sesión con tu cámara.",
        type: "success",
      });
      setIsRegisteringFace(false);
    } catch (error: any) {
      setSecurityMsg({
        text: "Error al guardar tu rostro: " + error.message,
        type: "error",
      });
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
                  <Sun className="mr-2 h-4 w-4" /> Claro
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer"
                >
                  <Moon className="mr-2 h-4 w-4" /> Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer"
                >
                  <Laptop className="mr-2 h-4 w-4" /> Sistema
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive cursor-pointer"
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
              Actualiza tu información o cambia tus ajustes de seguridad
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
                    accept="image/*"
                    onChange={handleFotoChange}
                  />
                  <Avatar
                    className={`h-24 w-24 ${isUploadingFoto ? "opacity-50" : ""}`}
                  >
                    <AvatarImage src={perfil?.foto_url || ""} />
                    <AvatarFallback className="text-2xl">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingFoto && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFoto}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre visible</Label>
                <Input
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder="¿Qué estás pensando?"
                />
              </div>

              {generalMsg.text && (
                <p
                  className={`text-sm font-medium ${generalMsg.type === "error" ? "text-destructive" : "text-green-600"}`}
                >
                  {generalMsg.text}
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleUpdateGeneral}
                disabled={
                  isUpdating || isUploadingFoto || !nombreUsuario.trim()
                }
              >
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              {isRegisteringFace ? (
                <div className="flex flex-col space-y-2">
                  <FaceScanner
                    onFaceDetected={handleFaceRegistration}
                    onCancel={() => setIsRegisteringFace(false)}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Nueva contraseña</Label>
                    <Input
                      type="password"
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({ ...passwords, new: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar nueva contraseña</Label>
                    <Input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirm: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleUpdatePassword}
                    disabled={
                      isUpdating || !passwords.new || !passwords.confirm
                    }
                  >
                    {isUpdating ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>

                  <div className="mt-6 border-t pt-4 space-y-2">
                    <Label>Autenticación Biométrica</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Registra tu rostro para iniciar sesión rápidamente sin
                      contraseña.
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setIsRegisteringFace(true)}
                    >
                      <ScanFace className="mr-2 h-4 w-4" /> Registrar Rostro
                      (Web)
                    </Button>
                  </div>
                </>
              )}
              {securityMsg.text && (
                <p
                  className={`text-sm font-medium mt-2 ${securityMsg.type === "error" ? "text-destructive" : "text-green-600"}`}
                >
                  {securityMsg.text}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
