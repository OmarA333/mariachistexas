import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, DollarSign, Mail, Phone, Tag, CreditCard, Download, CheckCircle, FileText } from 'lucide-react';
import { Sale } from '../services/ventaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onDownload: (id: string) => void;
}

const getStatusColor = (status: string) => {
  if (status === 'Finalizado') return 'bg-blue-50 text-blue-600 border-blue-200';
  if (status === 'Confirmado') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (status === 'Cancelado')  return 'bg-red-50 text-red-500 border-red-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

export const VentaDetailModal: React.FC<Props> = ({ isOpen, onClose, sale, onDownload }) => {
  if (!isOpen || !sale) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-serif font-bold text-slate-800">Venta</h3>
              <span className="font-mono text-sm text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">#{sale.id}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(sale.status)}`}>
                {sale.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <Calendar size={12} /> Registrada el {sale.date}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row min-h-full">

            {/* ── COLUMNA IZQUIERDA ─────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-100">

              {/* Cliente */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={14} className="text-primary-600" /> Cliente
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nombre</p>
                      <p className="font-bold text-slate-700 text-sm">{sale.clientName}</p>
                    </div>
                  </div>
                  {sale.clientEmail && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <Mail size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                        <p className="font-bold text-slate-700 text-sm truncate">{sale.clientEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Monto Total</p>
                  <p className="text-[10px] text-slate-500">Moneda: COP</p>
                </div>
                <p className="text-3xl font-serif font-bold tracking-tight flex items-center gap-1">
                  <DollarSign size={24} className="text-emerald-500" />
                  {sale.amount.toLocaleString('es-CO')}
                </p>
              </div>

              {/* Reserva vinculada */}
              {sale.reservationId && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                  <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-600" />
                    Vinculado a Reserva #{sale.reservationId}
                  </p>
                </div>
              )}
            </div>

            {/* ── COLUMNA DERECHA ───────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 bg-slate-50">

              {/* Detalles de la venta */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-primary-600" /> Detalle de la Venta
                </h4>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Concepto</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        <Tag size={12} /> {sale.concept}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={12} /> {sale.date}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Método de Pago</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      <CreditCard size={12} /> {sale.method}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm"
          >
            Cerrar Detalle
          </button>
          <button
            onClick={() => onDownload(sale.id)}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Download size={16} /> Descargar PDF
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
