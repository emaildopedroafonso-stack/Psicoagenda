import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionStatus } from '../types';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

const Financial = () => {
  const { sessions, patients, updateSession } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const filteredSessions = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return sessions.filter(s => isSameMonth(new Date(s.date), date));
  }, [sessions, selectedMonth]);

  // Group by patient
  const financialData = useMemo(() => {
    const data: Record<string, { 
      patientId: string,
      patientName: string, 
      requiresReceipt: boolean,
      sessions: typeof sessions, 
      total: number, 
      paid: number, 
      pending: number 
    }> = {};

    filteredSessions.forEach(session => {
      // Include COMPLETED and PATIENT_ABSENT (if charged)
      // For this MVP, we assume all Patient Absences are charged unless manually cancelled
      if (session.status === SessionStatus.CANCELLED || session.status === SessionStatus.THERAPIST_ABSENT) return;

      if (!data[session.patientId]) {
        const p = patients.find(pat => pat.id === session.patientId);
        if (!p) return;
        data[session.patientId] = {
          patientId: p.id,
          patientName: p.name,
          requiresReceipt: p.requiresReceipt || false,
          sessions: [],
          total: 0,
          paid: 0,
          pending: 0
        };
      }

      data[session.patientId].sessions.push(session);
      
      // Only calculate value for Scheduled, Completed, Patient Absent
      if (session.status !== SessionStatus.SCHEDULED) {
         data[session.patientId].total += session.valueSnapshot;
         if (session.paid) {
           data[session.patientId].paid += session.valueSnapshot;
         } else {
           data[session.patientId].pending += session.valueSnapshot;
         }
      }
    });

    return Object.values(data);
  }, [filteredSessions, patients]);

  const totals = financialData.reduce((acc, curr) => ({
    total: acc.total + curr.total,
    paid: acc.paid + curr.paid,
    pending: acc.pending + curr.pending
  }), { total: 0, paid: 0, pending: 0 });

  const togglePaid = (sessionId: string, currentStatus: boolean) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      updateSession({ ...session, paid: !currentStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Controle Financeiro</h2>
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Esperado</p>
          <p className="text-2xl font-bold text-slate-800">R$ {totals.total.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
          <p className="text-sm text-green-600">Recebido</p>
          <p className="text-2xl font-bold text-green-700">R$ {totals.paid.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-sm text-amber-600">Pendente</p>
          <p className="text-2xl font-bold text-amber-700">R$ {totals.pending.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {financialData.map((record) => (
          <div key={record.patientId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-700">{record.patientName}</h3>
                {record.pending === 0 && record.total > 0 && (
                   <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Pago Total</span>
                )}
                {record.pending > 0 && (
                   <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Pendente</span>
                )}
                {record.requiresReceipt && record.paid > 0 && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-indigo-100">
                    <FileText size={12} /> Recibo Necessário
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-slate-500">A Receber: </span>
                <span className="font-bold text-slate-800">R$ {record.pending.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="pb-2">Data</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Valor</th>
                    <th className="pb-2 text-center">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {record.sessions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(session => (
                    <tr key={session.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">{format(new Date(session.date), "dd/MM/yyyy HH:mm")}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          session.status === SessionStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                          session.status === SessionStatus.PATIENT_ABSENT ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {session.status === SessionStatus.COMPLETED ? 'Realizada' :
                           session.status === SessionStatus.PATIENT_ABSENT ? 'Falta' : 'Agendada'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">R$ {session.valueSnapshot.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        {session.status !== SessionStatus.SCHEDULED && (
                          <button 
                            onClick={() => togglePaid(session.id, session.paid)}
                            className={`p-1 rounded-full transition-colors ${
                              session.paid 
                                ? 'text-green-500 hover:bg-green-50' 
                                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                            }`}
                            title={session.paid ? "Marcar como não pago" : "Marcar como pago"}
                          >
                            {session.paid ? <CheckCircle size={20} fill="currentColor" className="text-white" /> : <CheckCircle size={20} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {financialData.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            <AlertTriangle className="mx-auto mb-2 opacity-20" size={40} />
            Nenhum registro financeiro para este mês.
          </div>
        )}
      </div>
    </div>
  );
};

export default Financial;