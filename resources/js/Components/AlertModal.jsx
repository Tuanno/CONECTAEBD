import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';

export default function AlertModal({
    show = false,
    variant = 'warning', // 'warning' | 'error' | 'info'
    title = 'WARNING MESSAGE',
    headline = 'Warning!',
    message = '',
    confirmText = 'OK',
    cancelText = 'Cancelar',
    showCancel = false,
    onConfirm = () => {},
    onCancel = () => {},
}) {
    const palette = {
        warning: {
            icon: 'text-red-600',
            headline: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700 text-white',
        },
        error: {
            icon: 'text-red-700',
            headline: 'text-red-700',
            button: 'bg-red-700 hover:bg-red-800 text-white',
        },
        info: {
            icon: 'text-blue-600',
            headline: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
    }[variant] || {
        icon: 'text-red-600',
        headline: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700 text-white',
    };

    return (
        <Modal show={show} onClose={onCancel} maxWidth="md">
            {/* Top bar with traffic lights */}
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="uppercase tracking-wider font-semibold text-sm ml-2">
                    {title}
                </div>
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center bg-white">
                <div className="flex justify-center">
                    <div className={`w-16 h-16 rounded-xl bg-red-50 flex items-center justify-center mb-4`}>
                        <AlertTriangle className={`w-10 h-10 ${palette.icon}`} />
                    </div>
                </div>
                <h2 className={`text-3xl font-extrabold ${palette.headline} mb-2`}>{headline}</h2>
                {message && (
                    <p className="text-gray-600 max-w-md mx-auto mb-6">{message}</p>
                )}

                <div className="flex items-center justify-center gap-3">
                    {showCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold shadow-sm"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded-full font-bold shadow ${palette.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
