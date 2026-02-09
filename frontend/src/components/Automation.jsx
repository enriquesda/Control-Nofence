import React from 'react';
import { Cpu, Settings } from 'lucide-react';

const Automation = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Cpu className="mr-3 text-primary-600" size={32} />
                Panel de Automatización
            </h2>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Settings className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Próximamente</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Aquí podrás configurar y supervisar las tareas automáticas del sistema, como el envío de recordatorios y la generación de informes.
                </p>
            </div>
        </div>
    );
};

export default Automation;
