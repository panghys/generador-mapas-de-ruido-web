// Frontend/src/components/proyecto/DeleteConfirmModal.jsx
const DeleteConfirmModal = ({ proyecto, onConfirm, onCancel, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-dash-surface rounded-2xl w-full max-w-md mx-4 p-6 shadow-sm border border-dash-border">
        {/* Icono de alerta */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="font-sans font-semibold text-lg text-dash-text text-center mb-2">
          ¿Eliminar proyecto?
        </h2>

        <p className="text-dash-text-soft text-sm text-center mb-2">
          ¿Estás seguro de que deseas eliminar el proyecto
        </p>

        <p className="text-dash-text font-medium text-center mb-4">
          "{proyecto.nombre}"
        </p>

        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-xs text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Esta acción no se puede deshacer.</span>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-dash-text-soft hover:text-dash-text hover:bg-dash-surface-hover transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Eliminar proyecto
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
