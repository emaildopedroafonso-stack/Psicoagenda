import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Check, X, RefreshCw, AlertTriangle, Link, Trash2, Clock } from 'lucide-react';
import { Session, SessionStatus, Patient } from '../types';

// --- Modal para reconciliar importação ---
const ImportModal = ({ 
    session, 
    onClose 
}: { 
    session: Session, 
    onClose: () => void 
}) => {
    const { patients, updateSession, removeSession } = useAppContext();
    const [selectedPatientId, setSelectedPatientId] = useState<string>(
        session.patientId !== 'unmatched' ? session.patientId : ''
    );

    // Se o ID da sessão já corresponde a um paciente válido, pré-selecione
    const suggestedPatient = patients.find(p => p.id === session.patientId);

    const handleConfirm = () => {
        if (!selectedPatientId) return;
        
        const patient = patients.find(p => p.id === selectedPatientId);
        if (patient) {
            updateSession({
                ...session,
                status: SessionStatus.SCHEDULED,
                patientId: patient.id,
                valueSnapshot: patient.valuePerSession
            });
            onClose();
        }
    };

    const handleDelete = () => {
        removeSession(session.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold text-slate-800">Evento Importado</h3>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <p className="text-sm text-slate-500 mb-1">Item da Agenda Google:</p>
                    <p className="text-lg font-bold text-slate-800">{session.importedName || 'Sem título'}</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Data: {format(parseISO(session.date), "dd/MM 'às' HH:mm")}
                    </p>
                </div>

                {suggestedPatient ? (
                     <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 mb-2">Encontramos um paciente com este nome:</p>
                        <p className="font-bold text-green-900 flex items-center gap-2">
                            <Check size={16} /> {suggestedPatient.name}
                        </p>
                     </div>
                ) : (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vincular a qual paciente?</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">Selecione um paciente...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Se não for uma sessão, clique em excluir.
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={handleDelete}
                        className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={18} /> Excluir
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedPatientId && !suggestedPatient}
                        className={`flex-1 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm ${
                            (!selectedPatientId && !suggestedPatient) 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                        }`}
                    >
                        <Link size={18} /> Confirmar Sessão
                    </button>
                </div>
            </div>
        </div>
    );
};

const CalendarPage = () => {
  const { sessions, patients, generateMonthlySessions, updateSession, syncGoogleCalendar } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [importModalSession, setImportModalSession] = useState<Session | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-generate sessions for the viewed month if not exists
    generateMonthlySessions(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  // Offset for start of week
  const startingDayIndex = getDay(startOfMonth(currentDate));

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const sessionsOnSelectedDate = sessions.filter(s => 
    isSameDay(new Date(s.date), selectedDate)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleStatusChange = (session: Session, newStatus: SessionStatus) => {
    updateSession({ ...session, status: newStatus });
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    // Em mobile, scroll suave até a lista de detalhes
    if (window.innerWidth < 1024 && detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Agenda</h2>
         <button 
            onClick={syncGoogleCalendar}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
         >
            <RefreshCw size={16} className="text-blue-500" />
            Sincronizar Google Agenda
         </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar View */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <div className="flex gap-1 sm:gap-2">
                    <button onClick={handlePrevMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
                    <button onClick={handleNextMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2 text-center text-xs sm:text-sm font-medium text-slate-400">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[50px] sm:min-h-[80px]" />
            ))}
            {daysInMonth.map(day => {
                const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const hasUnconfirmed = daySessions.some(s => s.status === SessionStatus.UNCONFIRMED);

                return (
                <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                    rounded-lg p-1 sm:p-2 flex flex-col items-center relative transition-all border min-h-[50px] sm:min-h-[80px]
                    ${isSelected ? 'bg-teal-600 text-white shadow-md border-teal-600 z-10 scale-[1.02]' : 'hover:bg-slate-50 text-slate-700 border-transparent'}
                    ${isToday && !isSelected ? 'bg-teal-50 border-teal-200 font-semibold' : ''}
                    ${hasUnconfirmed && !isSelected ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#fff7ed_5px,#fff7ed_10px)] border-amber-200' : ''}
                    `}
                >
                    <span className={`text-xs sm:text-sm font-medium ${isToday && !isSelected ? 'text-teal-700' : ''}`}>
                    {format(day, 'd')}
                    </span>
                    
                    <div className="flex gap-0.5 sm:gap-1 mt-1 flex-wrap justify-center max-w-full">
                    {daySessions.slice(0, 4).map((s, idx) => (
                        <div 
                        key={s.id} 
                        className={`rounded-full shadow-sm
                            ${idx > 1 ? 'hidden sm:block' : ''} /* Esconde excesso em telas mto pequenas */
                            ${isSelected ? 'w-1.5 h-1.5 sm:w-2 sm:h-2' : 'w-1 h-1 sm:w-1.5 sm:h-1.5'}
                            ${
                            s.status === SessionStatus.COMPLETED ? 'bg-green-400' :
                            s.status === SessionStatus.UNCONFIRMED ? (isSelected ? 'bg-amber-300' : 'bg-amber-500') :
                            s.status === SessionStatus.SCHEDULED ? (isSelected ? 'bg-white' : 'bg-teal-400') :
                            'bg-red-400'
                        }`} 
                        />
                    ))}
                    {daySessions.length > 2 && (
                         <span className="sm:hidden text-[8px] leading-none text-slate-400 dark:text-slate-200">
                             +
                         </span>
                    )}
                    </div>
                </button>
                );
            })}
            </div>
        </div>

        {/* Day Details Sidebar */}
        <div ref={detailsRef} className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 overflow-y-auto lg:max-h-[calc(100vh-200px)]">
            <h3 className="text-lg font-bold text-slate-800 mb-1 capitalize border-b pb-2 mb-4">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            
            <div className="space-y-3">
            {sessionsOnSelectedDate.map(session => {
                const isUnconfirmed = session.status === SessionStatus.UNCONFIRMED;
                const patient = patients.find(p => p.id === session.patientId);
                const displayName = isUnconfirmed ? (session.importedName || 'Evento Importado') : (patient?.name || 'Paciente Desconhecido');

                return (
                <div 
                    key={session.id} 
                    className={`border rounded-lg p-3 sm:p-4 transition-all ${
                        isUnconfirmed 
                        ? 'border-amber-200 bg-amber-50 hover:shadow-md cursor-pointer relative overflow-hidden' 
                        : 'border-slate-100 bg-slate-50 hover:shadow-md'
                    }`}
                    onClick={() => isUnconfirmed && setImportModalSession(session)}
                >
                    {isUnconfirmed && (
                         <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/50 -translate-y-8 translate-x-8 rotate-45"></div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="flex flex-col">
                            <span className={`text-xs font-semibold flex items-center gap-1 mb-1 ${isUnconfirmed ? 'text-amber-700' : 'text-slate-500'}`}>
                                <Clock size={12} />
                                {format(parseISO(session.date), 'HH:mm')}
                            </span>
                            <h4 className={`font-bold text-sm sm:text-base leading-tight ${isUnconfirmed ? 'text-amber-900' : 'text-slate-800'}`}>
                                {displayName}
                            </h4>
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                            session.status === SessionStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' :
                            session.status === SessionStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                            session.status === SessionStatus.UNCONFIRMED ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {session.status === SessionStatus.SCHEDULED ? 'Agendado' :
                            session.status === SessionStatus.COMPLETED ? 'Realizado' :
                            session.status === SessionStatus.UNCONFIRMED ? 'Confirmar?' :
                            session.status === SessionStatus.PATIENT_ABSENT ? 'Falta' : 'Canc.'}
                        </span>
                    </div>

                    {!isUnconfirmed ? (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200/50">
                            <button
                                onClick={() => handleStatusChange(session, SessionStatus.COMPLETED)}
                                className={`flex-1 py-1.5 sm:py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                                session.status === SessionStatus.COMPLETED 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white border border-slate-200 hover:bg-green-50 text-slate-600'
                                }`}
                            >
                                <Check size={14} /> Presença
                            </button>
                            <button
                                onClick={() => handleStatusChange(session, SessionStatus.PATIENT_ABSENT)}
                                className={`flex-1 py-1.5 sm:py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                                session.status === SessionStatus.PATIENT_ABSENT
                                ? 'bg-red-600 text-white'
                                : 'bg-white border border-slate-200 hover:bg-red-50 text-slate-600'
                                }`}
                            >
                                <X size={14} /> Falta
                            </button>
                        </div>
                    ) : (
                        <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Toque para validar
                        </div>
                    )}
                </div>
                );
            })}

            {sessionsOnSelectedDate.length === 0 && (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <CalIcon size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">Dia livre.</p>
                </div>
            )}
            </div>
        </div>
      </div>

      {importModalSession && (
          <ImportModal 
            session={importModalSession} 
            onClose={() => setImportModalSession(null)} 
          />
      )}
    </div>
  );
};

export default CalendarPage;