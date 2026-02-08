import React from 'react';
import { useCompany } from '../../context/CompanyContext';

const DynamicLoader = ({ text, size = "large", layout = "col", className = "" }) => {
    const { empresa } = useCompany();

    const sizes = {
        large: { container: "w-16 h-16", img: "w-14 h-14", padding: "py-12", spinner: "h-12 w-12" },
        medium: { container: "w-12 h-12", img: "w-10 h-10", padding: "py-8", spinner: "h-8 w-8" },
        small: { container: "w-8 h-8", img: "w-6 h-6", padding: "py-4", spinner: "h-6 w-6" },
        tiny: { container: "w-5 h-5", img: "w-4 h-4", padding: "py-0", spinner: "h-4 w-4 border-2" }
    };

    const currentSize = sizes[size] || sizes.large;
    const flexDirection = layout === 'row' ? 'flex-row gap-2' : 'flex-col';

    return (
        <div className={`flex ${flexDirection} items-center justify-center ${currentSize.padding} ${className}`}>
            <div className={`relative ${currentSize.container} ${(text && layout === 'col') ? 'mb-2' : ''} flex items-center justify-center`}>
                {/* Logo Giratorio o Fallback */}
                {empresa?.logo ? (
                    <img
                        src={empresa.logo}
                        alt="Cargando"
                        className={`${currentSize.img} object-contain animate-spin rounded-full`}
                        style={{ animationDuration: '2s' }}
                    />
                ) : (
                    // Fallback Spinner si no hay logo aún
                    <div className={`animate-spin rounded-full ${currentSize.spinner} border-b-2 border-primary-600`}></div>
                )}

                {/* Anillo exterior decorativo - solo para tamaños grandes/medianos */}
                {(size === 'large' || size === 'medium') && (
                    <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full select-none pointer-events-none"></div>
                )}
            </div>
            {text && <p className="text-sm text-gray-500 font-medium animate-pulse">{text}</p>}
        </div>
    );
};

export default DynamicLoader;
