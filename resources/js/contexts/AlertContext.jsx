import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AlertModal from '@/Components/AlertModal';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [state, setState] = useState({
        open: false,
        mode: 'alert', // 'alert' | 'confirm'
        options: {},
        resolver: null,
    });

    const close = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
    }, []);

    const alert = useCallback(({ title, headline, message, confirmText = 'OK', variant = 'warning' } = {}) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                mode: 'alert',
                resolver: () => resolve(true),
                options: { title, headline, message, confirmText, variant },
            });
        });
    }, []);

    const confirm = useCallback(({ title, headline, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'warning' } = {}) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                mode: 'confirm',
                resolver: (result) => resolve(!!result),
                options: { title, headline, message, confirmText, cancelText, variant },
            });
        });
    }, []);

    const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

    const handleConfirm = () => {
        const resolver = state.resolver;
        close();
        resolver && resolver(true);
    };

    const handleCancel = () => {
        const resolver = state.resolver;
        close();
        resolver && resolver(false);
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
            <AlertModal
                show={state.open}
                variant={state.options.variant || 'warning'}
                title={state.options.title || (state.mode === 'confirm' ? 'MENSAGEM DE AVISO' : 'MENSAGEM DE AVISO')}
                headline={state.options.headline || (state.mode === 'confirm' ? 'Confirmar' : 'Aviso!')}
                message={state.options.message || ''}
                confirmText={state.options.confirmText || (state.mode === 'confirm' ? 'Confirmar' : 'OK')}
                cancelText={state.options.cancelText || 'Cancelar'}
                showCancel={state.mode === 'confirm'}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlert must be used within AlertProvider');
    return ctx;
}
