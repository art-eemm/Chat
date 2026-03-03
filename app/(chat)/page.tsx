export default function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 h-full w-full">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Bienvenido a tu Chat</h2>
        <p className="text-muted-foreground">
          Selecciona un contacto de la lista para iniciar una conversación.
        </p>
      </div>
    </div>
  );
}
