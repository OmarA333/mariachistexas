import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, CheckCircle, AlertCircle, X, Eye, Download, CreditCard, Calendar, User, CheckSquare, Clock, Plus, DollarSign, MapPin, Package, Music, FileText, Mail } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { UserRole } from '@/types';
import api from '@/shared/api/api';
import { TablePagination } from '@/shared/components/TablePagination';
import { AbonoCreateModal } from '@/src/features/abonos/components/AbonoCreateModal.tsx';
import { VentaCreateModal } from '../components/VentaCreateModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SaleRecord {
  id:                 string;
  date:               string;
  type:               string;
  clientName:         string;
  clientId?:          string;
  clientEmail?:       string;
  concept:            string;
  method:             string;
  amount:             number;
  totalAmount?:       number;
  pendingAmount?:     number;
  paidAmount?:        number;
  reservationId?:     string;
  reservationStatus?: string;
  eventDate?:         string;
  eventType?:         string;
  status:             string;
  abonos?:            { id: string; amount: number; date: string; method: string; notes: string }[];
  // ─── Nuevos ───────────────────────────────────────────────────────────────
  eventTime?:         string;
  eventEndTime?:      string;
  eventLocation?:     string;
  homenajeado?:       string;
  notes?:             string;
  services?:          { nombre: string; cantidad: number; precio: number }[];
  repertoire?:        { titulo: string; artista: string }[];
}

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  NEQUI:         'Nequi',
  DAVIPLATA:     'Daviplata',
  OTRO:          'Otro',
};

// ─── AbonoModal - 2nd payment (final balance) ─────────────────────────────────
interface FinalPaymentModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  sale:          SaleRecord | null;
  onSave:        (data: { reservationId: string; amount: number; date: string; method: string; notes?: string }) => Promise<void>;
}

const FinalPaymentModal: React.FC<FinalPaymentModalProps> = ({ isOpen, onClose, sale, onSave }) => {
  const [method,  setMethod]  = useState('TRANSFERENCIA');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const saldo = sale?.pendingAmount ?? 0;

  useEffect(() => {
    if (isOpen) {
      setMethod('TRANSFERENCIA');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale?.reservationId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        reservationId: sale.reservationId,
        amount:        saldo,
        date,
        method,
        notes:         notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !sale) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between text-white shadow-lg shadow-red-900/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
              <CheckSquare size={16} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-serif font-bold tracking-wide uppercase">Registrar Saldo Final</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 text-red-600 text-xs shadow-sm shadow-red-100/50">
              <AlertCircle size={16} className="shrink-0" /> 
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Info box */}
          <div className="bg-red-50/50 border border-red-100 rounded-[1.5rem] p-5 mb-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100/30 rounded-full blur-2xl group-hover:bg-red-200/40 transition-colors" />
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-[0.2em] mb-1.5 relative z-10">Saldo a pagar</p>
            <p className="text-4xl font-serif font-black text-red-600 tracking-tight relative z-10">
              <span className="text-xl mr-0.5">$</span>{saldo.toLocaleString('es-CO')}
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-red-100/60 flex items-center justify-between relative z-10">
               <p className="text-[10px] text-red-500 font-medium">{sale.concept}</p>
               <p className="text-[10px] text-slate-400">Total: <span className="font-bold">${(sale.totalAmount ?? 0).toLocaleString('es-CO')}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Método de Pago</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all bg-slate-50 shadow-inner"
              >
                {Object.entries(metodoPagoLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha de Pago</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all bg-slate-50 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all bg-slate-50 shadow-inner resize-none"
                placeholder="Referencia de pago..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] py-3.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.15em] shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? 'Procesando...' : (
                  <>
                    <CreditCard size={14} />
                    <span>Pagar ${saldo.toLocaleString('es-CO')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

const SaleDetailModal: React.FC<{ isOpen: boolean; onClose: () => void; sale: SaleRecord | null; onDownload: (id: string) => void }> = ({ isOpen, onClose, sale, onDownload }) => {
  if (!isOpen || !sale) return null;
  const isFinalizado = sale.status === 'Finalizado' || (sale.pendingAmount ?? 0) <= 0;

  const getStatusColor = () => {
    if (isFinalizado) return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-serif font-bold text-slate-800">Venta</h3>
              <span className="font-mono text-sm text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">#{sale.id.replace('RES-','')}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor()}`}>
                {isFinalizado ? 'Finalizado' : 'Confirmado'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <Calendar size={12} /> {sale.eventDate ?? sale.date}
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
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><User size={14} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nombre</p>
                      <p className="font-bold text-slate-700 text-sm">{sale.clientName}</p>
                    </div>
                  </div>
                  {sale.clientEmail && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
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
                  {(sale.totalAmount ?? sale.amount).toLocaleString('es-CO')}
                </p>
              </div>

              {/* Historial de pagos */}
              {sale.abonos && sale.abonos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CreditCard size={14} className="text-primary-600" /> Historial de Pagos
                  </h4>
                  <div className="space-y-2">
                    {sale.abonos.map((abono, idx) => (
                      <div key={abono.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{idx === 0 ? '1er Abono' : '2do Abono'}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(abono.date).toLocaleDateString('es-CO')} · {metodoPagoLabel[abono.method] ?? abono.method}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">${abono.amount.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </div>
                  {!isFinalizado && (sale.pendingAmount ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 mt-2 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-xs font-bold text-red-700">Saldo Pendiente</span>
                      <span className="text-sm font-bold text-red-700">${(sale.pendingAmount ?? 0).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── COLUMNA DERECHA ───────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 bg-slate-50">

              {/* Evento */}
              {(sale.eventDate || sale.eventTime || sale.eventType || sale.homenajeado || sale.eventLocation) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={14} className="text-primary-600" /> Evento
                  </h4>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    {sale.homenajeado && (
                      <div className="pb-4 border-b border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Homenajeado</p>
                        <p className="font-bold text-slate-800 flex items-center gap-2"><User size={12} /> {sale.homenajeado}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {sale.eventType && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
                          <p className="font-bold text-slate-800 text-sm">{sale.eventType}</p>
                        </div>
                      )}
                      {sale.eventDate && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</p>
                          <p className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={12} /> {sale.eventDate}</p>
                        </div>
                      )}
                      {sale.eventTime && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Horario</p>
                          <p className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={12} /> {sale.eventTime}{sale.eventEndTime ? ` - ${sale.eventEndTime}` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                    {sale.eventLocation && (
                      <div className="pt-2 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dirección</p>
                        <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={12} /> {sale.eventLocation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Servicios */}
              {sale.services && sale.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} className="text-primary-600" /> Servicios Contratados
                  </h4>
                  <div className="space-y-2">
                    {sale.services.map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{s.nombre}</p>
                          <p className="text-[10px] text-slate-400">${Number(s.precio).toLocaleString('es-CO')} c/u · x{s.cantidad}</p>
                        </div>
                        <p className="text-sm font-bold text-orange-600">${(s.precio * s.cantidad).toLocaleString('es-CO')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repertorio */}
              {sale.repertoire && sale.repertoire.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Music size={14} className="text-primary-600" /> Repertorio ({sale.repertoire.length} canciones)
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                    {sale.repertoire.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                          <Music size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{r.titulo}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{r.artista}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {sale.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-primary-600" /> Notas
                  </h4>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600 italic">"{sale.notes}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 justify-end shrink-0">
          <button onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
            Cerrar Detalle
          </button>
          {sale.reservationId && (
            <button
              onClick={() => onDownload(sale.reservationId!)}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Download size={16} /> Descargar PDF
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const VentasPage: React.FC = () => {
  const { user }        = useAuth();
  const [sales,         setSales]         = useState<SaleRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [notification,  setNotification]  = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailSale,    setDetailSale]    = useState<SaleRecord | null>(null);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
     const [finalPaySale,  setFinalPaySale]  = useState<SaleRecord | null>(null);
    const [isFinalPayOpen,setIsFinalPayOpen]= useState(false);
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
    

  const isClient = user?.role === UserRole.CLIENTE;
  const itemsPerPage = 10;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

   const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas');
      // El backend ahora devuelve { ok, data: [...], total }
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setSales(list);
    } catch {
      showNotification('Error cargando ventas.', 'error');
    } finally {
      setLoading(false);
    }
  };
 

  useEffect(() => { fetchSales(); }, [user]);

  const handleFinalPayment = async (data: { reservationId: string; amount: number; date: string; method: string; notes?: string }) => {
    await api.post(`/ventas/reserva/${data.reservationId}/abono`, {
      amount: data.amount,
      date:   data.date,
      method: data.method,
      notes:  data.notes,
    });
    showNotification('Pago final registrado. ¡Reserva finalizada!');
    setIsFinalPayOpen(false);
    await fetchSales();
  };

const handleCreateSale = async (data: any) => {
  const esReserva = data.type !== 'Directa'
 
  await api.post('/ventas', {
    reservaId:   esReserva && data.reservationId ? Number(data.reservationId) : null,
    clienteId:   Number(data.clienteId),
    tipo:        esReserva ? 'RESERVA' : 'DIRECTA',
    estado:      'CONFIRMADO',
    montoTotal:  esReserva ? Number(data.totalAmount) : Number(data.amount),
    montoPagado: esReserva ? Number(data.paidAmount)  : Number(data.amount),
    fechaVenta:  data.date,
    metodoPago:  String(data.method).toUpperCase(),
  })
 
  // Solo llega aquí si el POST fue exitoso (2xx)
  showNotification('Venta registrada correctamente')
  setIsNewSaleOpen(false)
  await fetchSales()

}

  const handleDownloadPdf = async (reservationId: string) => {
    showNotification('Generando PDF...');
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ventas/reserva/${reservationId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Reserva-${reservationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('PDF descargado correctamente.');
    } catch {
      showNotification('Error al generar el PDF.', 'error');
    }
  };

  const filtered = sales.filter(s =>
    (s.clientName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages   = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  ///pendiente de revision
  const getStatusBadge = (sale: SaleRecord) => {
    const isFinalizado = sale.status === 'Finalizado' || (sale.pendingAmount ?? 0) <= 0;
    if (isFinalizado) return { label: 'Finalizado', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (sale.reservationId) return { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Venta Directa', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">

      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] bg-white/95 ${notification.type === 'success' ? 'border-emerald-100' : 'border-red-100'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-800">{notification.type === 'success' ? 'Notificación' : 'Error'}</h4>
              <p className="text-xs text-slate-500">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-wide uppercase">
            {isClient ? 'Mis Pagos' : 'Gestión de Ventas'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isClient
              ? 'Historial de tus pagos y reservas confirmadas.'
              : 'Reservas confirmadas con anticipo del 50%. Registra pagos finales aquí.'}
          </p>
        </div>
        {!isClient && (
          <button
            onClick={() => setIsNewSaleOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
          >
            <Plus size={16} strokeWidth={3} /> REGISTRAR VENTA
          </button>
        )}
      </div>



      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Cargando ventas...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No se encontraron registros.</div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto p-8 pt-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID / Fecha</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente / Concepto</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total / Saldo</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map(sale => {
                    const badge       = getStatusBadge(sale);
                    const isFinalizado = sale.status === 'Finalizado' || (sale.pendingAmount ?? 0) <= 0;
                    const hasPending   = !isFinalizado && (sale.pendingAmount ?? 0) > 0 && !!sale.reservationId;

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">#{sale.id.replace('RES-','')}</span>
                          {sale.eventDate && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={10} /> {sale.eventDate}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                            <User size={12} className="text-slate-400" /> {sale.clientName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{sale.concept}</p>
                          {sale.eventType && (
                            <p className="text-[10px] text-slate-300 uppercase tracking-wide">{sale.eventType}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-bold text-slate-700">
                            ${(sale.totalAmount ?? sale.amount).toLocaleString('es-CO')}
                          </p>
                          {!isFinalizado && (sale.pendingAmount ?? 0) > 0 && (
                            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                              <Clock size={10} /> Pendiente: ${(sale.pendingAmount ?? 0).toLocaleString('es-CO')}
                            </p>
                          )}
                          {isFinalizado && (
                            <p className="text-[10px] font-bold text-emerald-500">✓ Pagado</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setDetailSale(sale); setIsDetailOpen(true); }}
                              title="Ver detalle"
                              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Pay final balance - only for admin/employee on confirmed reservations */}
                            {!isClient && hasPending && (
                              <button
                                onClick={() => { setFinalPaySale(sale); setIsFinalPayOpen(true); }}
                                title="Registrar pago final"
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all"
                              >
                                <CreditCard size={14} />
                              </button>
                            )}

                            {/* Download PDF */}
                            {sale.reservationId && (
                              <button
                                onClick={() => handleDownloadPdf(sale.reservationId!)}
                                title="Descargar PDF"
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all"
                              >
                                <Download size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={detailSale}
        onDownload={handleDownloadPdf}
    />
    <FinalPaymentModal
        isOpen={isFinalPayOpen}
        onClose={() => setIsFinalPayOpen(false)}
        sale={finalPaySale}
        onSave={handleFinalPayment}
    />
      <VentaCreateModal
  isOpen={isNewSaleOpen}
  onClose={() => setIsNewSaleOpen(false)}
  onSave={handleCreateSale}
/>
    </div>
  );
};