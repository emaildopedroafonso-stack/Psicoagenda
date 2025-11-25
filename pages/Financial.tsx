import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionStatus } from '../types';
import { CheckCircle, AlertTriangle, FileText, Download, DollarSign } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Financial = () => {
  const { sessions, patients, updateSession, user } = useAppContext();
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthName = format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136); // Teal-600 color
    doc.text("Psico-Agenda", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(`Relatório Financeiro Mensal`, 14, 28);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Referência: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 34);

    doc.setFontSize(10);
    doc.text(`Psicólogo(a): ${user?.name || 'N/A'}`, 14, 40);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 45);

    // Summary Box
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(14, 50, 180, 20, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text("Resumo:", 20, 63);
    
    doc.text(`Esperado: R$ ${totals.total.toFixed(2)}`, 50, 63);
    
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`Recebido: R$ ${totals.paid.toFixed(2)}`, 100, 63);
    
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Pendente: R$ ${totals.pending.toFixed(2)}`, 150, 63);

    // Table Data preparation
    const tableBody = filteredSessions
        .filter(s => s.status !== SessionStatus.CANCELLED && s.status !== SessionStatus.THERAPIST_ABSENT)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(session => {
            const patient = patients.find(p => p.id === session.patientId);
            const statusLabel = 
                session.status === SessionStatus.COMPLETED ? 'Realizada' : 
                session.status === SessionStatus.PATIENT_ABSENT ? 'Falta Paciente' : 
                'Agendada';
            
            return [
                format(parseISO(session.date), 'dd/MM HH:mm'),
                patient?.name || 'Desconhecido',
                statusLabel,
                `R$ ${session.valueSnapshot.toFixed(2)}`,
                session.paid ? 'Sim' : 'Não'
            ];
        });

    // Generate Table
    autoTable(doc, {
        startY: 75,
        head: [['Data', 'Paciente', 'Status', 'Valor', 'Pago']],
        body: tableBody,
        headStyles: { fillColor: [13, 148, 136] }, // Teal-600
        alternateRowStyles: { fillColor: [240, 253, 250] }, // Teal-50
        styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`Relatorio_Financeiro_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Controle Financeiro</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <button
                onClick={generatePDF}
                className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium flex-1 sm:flex-none"
                title="Baixar PDF"
            >
                <Download size={18} />
                Relatório PDF
            </button>
            <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
            />
        </div>
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
                {record.requiresReceipt && record.paid > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold border border-indigo-100">
                        <FileText size={12} /> Emitir Recibo
                    </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Pendente: </span>
                <span className={`font-bold ${record.pending > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                   R$ {record.pending.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {record.sessions.map(session => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {format(parseISO(session.date), "dd/MM 'às' HH:mm")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === SessionStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                        session.status === SessionStatus.PATIENT_ABSENT ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {session.status === SessionStatus.COMPLETED ? 'Realizada' : 
                         session.status === SessionStatus.PATIENT_ABSENT ? 'Falta' : 'Agendada'}
                      </span>
                      <span className="text-xs text-slate-500">R$ {session.valueSnapshot}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => togglePaid(session.id, session.paid)}
                    className={`p-2 rounded-full transition-all ${
                      session.paid 
                      ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                      : 'bg-slate-100 text-slate-300 hover:bg-green-100 hover:text-green-500'
                    }`}
                    title={session.paid ? "Marcar como não pago" : "Marcar como pago"}
                  >
                    <DollarSign size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {financialData.length === 0 && (
            <div className="text-center py-12 text-slate-400">
                Nenhuma sessão registrada neste mês.
            </div>
        )}
      </div>
    </div>
  );
};

export default Financial;