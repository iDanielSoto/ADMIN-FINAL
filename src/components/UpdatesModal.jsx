import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Server, Package, ExternalLink, Github, Info } from 'lucide-react';

const UpdatesModal = ({ isOpen, onClose }) => {
    const [ghRelease, setGhRelease] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchGitHubRelease();
        }
    }, [isOpen]);

    const fetchGitHubRelease = async () => {
        try {
            setLoadingInfo(true);
            setErrorMsg(null);
            
            // Reemplaza con tu cuenta y nombre de repositorio correcto.
            const response = await fetch('https://api.github.com/repos/iDanielSoto/escritorio/releases/latest');
            
            if (!response.ok) {
                if (response.status === 404) {
                    setErrorMsg('No se ha publicado ninguna Release en el repositorio aún.');
                } else {
                    setErrorMsg('No se pudo conectar con GitHub API.');
                }
                setGhRelease(null);
                setLoadingInfo(false);
                return;
            }

            const data = await response.json();
            setGhRelease({
                version: data.tag_name,
                name: data.name,
                url: data.html_url,
                publishDate: data.published_at,
                body: data.body,
                assets: data.assets || []
            });

        } catch (error) {
            console.error("Error fetching github release:", error);
            setErrorMsg('Error de red al consultar GitHub.');
        } finally {
            setLoadingInfo(false);
        }
    };

    if (!isOpen) return null;

    // Buscamos si hay un ejecutable en los assets de GitHub
    const exeAsset = ghRelease?.assets.find(a => a.name.endsWith('.exe'));

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 max-w-2xl w-full max-h-[95vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Github className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                        Gestión de Actualizaciones
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto w-full flex-grow">
                    {/* Banner Informativo */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex gap-4">
                        <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Modo de Publicación Nativo</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                El ecosistema ha sido configurado para consumir actualizaciones directamente desde la infraestructura global de GitHub Releases.
                                Las actualizaciones ya no se suben por este panel. Utiliza el comando <code>npm run build</code> o <code>electron-builder --publish always</code> desde tu entorno de desarrollo para publicar nuevas versiones.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Última Versión Distribuida</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Esta es la versión que los Kioscos instalarán al arrancar.</p>
                            </div>
                        </div>

                        {loadingInfo ? (
                            <div className="animate-pulse space-y-4 py-2">
                                <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        ) : errorMsg ? (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{errorMsg}</p>
                            </div>
                        ) : ghRelease && (
                            <div className="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Release Tag</p>
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-400">Stable</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{ghRelease.version}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{ghRelease.name}</p>
                                    </div>
                                    <a 
                                        href={ghRelease.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 text-sm font-semibold bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Ver en GitHub <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha de Publicación</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {new Date(ghRelease.publishDate).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Instalador (.exe)</p>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            {exeAsset ? (
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={exeAsset.name}>
                                                    {exeAsset.name} 
                                                    <span className="text-xs text-slate-400 ml-2 font-mono">
                                                        {(exeAsset.size / (1024 * 1024)).toFixed(1)} MB
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500">Ninguno detectado</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UpdatesModal;
