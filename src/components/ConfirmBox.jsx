import { createPortal } from 'react-dom';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';

function ConfirmBox({ message, onConfirm, onCancel }) {
    const isConfirm = !!onCancel;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel || onConfirm}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full animate-[fadeIn_0.15s_ease-out] overflow-hidden">
                {/* Barra superior de color */}
                <div className={`h-1 ${isConfirm ? 'bg-yellow-500' : 'bg-blue-500'}`} />

                <div className="p-6">
                    {/* Icono + Mensaje */}
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isConfirm ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isConfirm
                                ? <FiAlertCircle className="w-5 h-5" />
                                : <FiInfo className="w-5 h-5" />
                            }
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {isConfirm ? 'Confirmar acción' : 'Aviso'}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-6">
                        {isConfirm ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    Sí, continuar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmBox;
