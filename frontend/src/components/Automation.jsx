import React from 'react';
import { Cpu, Settings } from 'lucide-react';

const Automation = () => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState(null);

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

                {/* Placeholder for more automations */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                    <Settings className="mb-2 opacity-50" size={32} />
                    <span className="text-sm font-medium">Más automatizaciones pronto</span>
                </div>
            </div>
        </div>
    );
};

export default Automation;
