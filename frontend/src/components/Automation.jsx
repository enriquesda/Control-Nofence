import React from 'react';
import { Cpu, Settings, Upload, FileUp, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const Automation = () => {
    // Current Automation State
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState(null);

    // Import Automation State
    const [importLoading, setImportLoading] = React.useState(false);
    const [importFile, setImportFile] = React.useState(null);
    const [previewData, setPreviewData] = React.useState(null);
    const [importResult, setImportResult] = React.useState(null);

    const handleGenerateCsv = async () => {
        setLoading(true);
        setResult(null);
        try {
            const response = await fetch('http://localhost:8000/api/automation/generate-client-csv', {
                method: 'POST',
            });

            const contentType = response.headers.get("content-type");

            if (response.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    setResult({ type: 'success', message: data.message || "Proceso completado." });
                } else {
                    // Blob response for file download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "clientes_filtrados.csv";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    setResult({ type: 'success', message: "Informe CSV generado y descargado correctamente." });
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setResult({ type: 'error', message: errorData.detail || "Error generando CSV." });
            }
        } catch (error) {
            console.error("Download error:", error);
            setResult({ type: 'error', message: "Error de conexión con el servidor." });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
            setPreviewData(null);
            setImportResult(null);
        }
    };

    const handlePreviewImport = async () => {
        if (!importFile) return;
        setImportLoading(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await fetch('http://localhost:8000/api/automation/preview-import', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setPreviewData(data);
            } else {
                setImportResult({ type: 'error', message: data.detail || "Error analizando archivo." });
            }
        } catch (error) {
            console.error(error);
            setImportResult({ type: 'error', message: "Error de conexión." });
        } finally {
            setImportLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;
        setImportLoading(true);
        try {
            // Transform map to list for backend if needed, or send map
            // Backend expects list of clients
            const clientsList = Object.values(previewData.raw_data);

            const response = await fetch('http://localhost:8000/api/automation/confirm-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: clientsList }),
            });
            const data = await response.json();
            if (response.ok) {
                setImportResult({ type: 'success', message: data.message });
                setPreviewData(null);
                setImportFile(null);
                // Reset file input manually if ref used, or just state
            } else {
                setImportResult({ type: 'error', message: data.detail || "Error procesando importación." });
            }
        } catch (error) {
            console.error(error);
            setImportResult({ type: 'error', message: "Error de conexión." });
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Cpu className="mr-3 text-primary-600" size={32} />
                Panel de Automatización
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: CSV Generator */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                            <Settings size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Informe Clientes Nofence</h3>
                    </div>
                    <p className="text-slate-500 mb-6 text-sm">
                        Genera un archivo CSV con los clientes que tienen acuerdos activos, facturas pagadas y justificación pendiente.
                    </p>

                    {result && (
                        <div className={`p-3 mb-4 rounded-md text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {result.message}
                        </div>
                    )}

                    <button
                        onClick={handleGenerateCsv}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${loading
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                    >
                        {loading ? 'Generando...' : 'Generar CSV'}
                    </button>
                </div>

                {/* Card 2: Import CSV */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
                            <Upload size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Cargar Clientes CSV</h3>
                    </div>
                    <p className="text-slate-500 mb-4 text-sm">
                        Importa clientes, acuerdos y facturas desde un archivo CSV (plantillaPasar.csv).
                    </p>

                    <div className="mb-4">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-purple-50 file:text-purple-700
                                hover:file:bg-purple-100"
                        />
                    </div>

                    {importResult && (
                        <div className={`p-3 mb-4 rounded-md text-sm ${importResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {importResult.message}
                        </div>
                    )}

                    {!previewData ? (
                        <button
                            onClick={handlePreviewImport}
                            disabled={importLoading || !importFile}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${importLoading || !importFile
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                        >
                            {importLoading ? 'Analizando...' : 'Analizar Archivo'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-md text-sm border border-slate-200">
                                <p className="font-semibold text-slate-700 mb-2">Resumen de Importación:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                    <li>Total Clientes detectados: <strong>{previewData.total}</strong></li>
                                    <li>Nuevos: {previewData.summary.filter(c => c.status === 'New').length}</li>
                                    <li>Actualizaciones: {previewData.summary.filter(c => c.status === 'Update').length}</li>
                                </ul>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => { setPreviewData(null); setImportFile(null); }}
                                    className="flex-1 py-2 px-4 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={importLoading}
                                    className="flex-1 py-2 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
                                >
                                    {importLoading ? 'Cargando...' : 'Confirmar Carga'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Automation;
