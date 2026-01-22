export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    const renderLabel = (text) => {
        if (!text) return children;
        
        // Procura pelo asterisco e colore em vermelho
        const parts = text.split('*');
        if (parts.length > 1) {
            return (
                <>
                    {parts[0]}
                    <span className="text-red-600">*</span>
                    {parts[1]}
                </>
            );
        }
        return text;
    };

    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-gray-700 ` +
                className
            }
        >
            {renderLabel(value)}
        </label>
    );
}
