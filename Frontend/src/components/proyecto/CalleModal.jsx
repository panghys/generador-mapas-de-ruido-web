import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const tiposCalle = ["Calle", "Avenida", "Pasaje", "Calle principal"];

const colores = [
  "#FF0000",
  "#0000FF",
  "#00AA00",
  "#FFFF00",
  "#FFA500",
  "#800080",
  "#000000",
  "#FFFFFF",
];

const CalleModal = ({ abierto, datosIniciales, onGuardar, onEliminar, onCancelar }) => {
  const [nombreCalle, setNombreCalle] = useState("");
  const [tipoCalle, setTipoCalle] = useState(tiposCalle[0]);
  const [colorCalle, setColorCalle] = useState("#FF0000");
  const [grandes, setGrandes] = useState(0);
  const [medianos, setMedianos] = useState(0);
  const [pequenos, setPequenos] = useState(0);

  const esEdicion = Boolean(datosIniciales?.id);

  useEffect(() => {
    if (!abierto) return;

    setNombreCalle(datosIniciales?.nombre_calle || "");
    setTipoCalle(datosIniciales?.tipo_calle || tiposCalle[0]);
    setColorCalle(datosIniciales?.color_asignado || "#FF0000");
    setGrandes(datosIniciales?.trafico_vehiculos_grandes ?? 0);
    setMedianos(datosIniciales?.trafico_vehiculos_medianos ?? 0);
    setPequenos(datosIniciales?.trafico_vehiculos_pequenos ?? 0);
  }, [abierto, datosIniciales]);

  if (!abierto) return null;

  const cambiarNumero = (e, setter) => {
    const valor = e.target.value.replace(/\D/g, "");
    setter(valor === "" ? 0 : Number(valor));
  };

  const handleGuardar = () => {
    onGuardar({
      nombre_calle: nombreCalle.trim(),
      tipo_calle: tipoCalle,
      color_asignado: colorCalle,
      trafico_vehiculos_grandes: grandes,
      trafico_vehiculos_medianos: medianos,
      trafico_vehiculos_pequenos: pequenos,
    });
  };

  const contenido = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto border border-dash-border bg-[#162326] p-5 text-dash-text shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{esEdicion ? "Editar calle" : "Nueva calle"}</h2>
          {!esEdicion && (
            <span className="border border-dash-accent px-2 py-0.5 text-[10px] font-medium text-dash-accent">
              Trazo pendiente de guardar
            </span>
          )}
        </div>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-xs text-dash-text-soft">Nombre</span>
          <input
            type="text"
            value={nombreCalle}
            onChange={(e) => setNombreCalle(e.target.value)}
            placeholder="Ej: Av. Picarte"
            className="w-full border border-dash-border bg-[#10191b] px-3 py-2 text-sm text-white outline-none focus:border-dash-accent"
          />
        </label>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-xs text-dash-text-soft">Tipo de calle</span>
          <select
            value={tipoCalle}
            onChange={(e) => setTipoCalle(e.target.value)}
            className="w-full border border-dash-border bg-[#10191b] px-3 py-2 text-sm text-white outline-none focus:border-dash-accent"
          >
            {tiposCalle.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <p className="mb-2 text-xs text-dash-text-soft">Color</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {colores.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setColorCalle(color)}
              className="h-7 w-7 border-2"
              style={{
                backgroundColor: color,
                borderColor: colorCalle === color ? "#ffffff" : "#555555",
              }}
            />
          ))}
        </div>

        <p className="mb-2 text-xs text-dash-text-soft">Tráfico vehicular</p>
        <div className="mb-5 flex flex-col gap-2">
          <label className="flex items-center justify-between text-sm">
            <span>Vehículos livianos / pequeños</span>
            <input
              type="text"
              inputMode="numeric"
              value={pequenos}
              onChange={(e) => cambiarNumero(e, setPequenos)}
              className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none focus:border-dash-accent"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Vehículos medianos</span>
            <input
              type="text"
              inputMode="numeric"
              value={medianos}
              onChange={(e) => cambiarNumero(e, setMedianos)}
              className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none focus:border-dash-accent"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Vehículos pesados / grandes</span>
            <input
              type="text"
              inputMode="numeric"
              value={grandes}
              onChange={(e) => cambiarNumero(e, setGrandes)}
              className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none focus:border-dash-accent"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGuardar}
            className="flex-1 bg-dash-accent px-3 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
          >
            {esEdicion ? "Actualizar datos" : "Guardar calle"}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:bg-[#1d2c2f]"
          >
            Cancelar
          </button>
        </div>

        {esEdicion && (
          <button
            type="button"
            onClick={onEliminar}
            className="mt-3 w-full border border-red-500 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            Eliminar calle
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default CalleModal;