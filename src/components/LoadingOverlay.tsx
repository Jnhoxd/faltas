import React from 'react';
import { Mail, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Enviando email...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-full">
              <Mail className="text-white" size={40} />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-xl font-bold text-gray-800">{message}</h3>
            <p className="text-sm text-gray-600">
              Por favor, aguarde enquanto processamos sua solicitação
            </p>
          </div>

          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Processando...</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0%, 100% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 100%;
            margin-left: 0%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
