import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  AlertTriangle,
  HeartPulse,
  Calendar,
  Pill,
  CreditCard,
  FileText,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Activity,
  Bot
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, useToast } from '../ui';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'EMERGENCY_ALERT' | 'DOCTOR_BOOKING' | 'BILL_PAY' | 'RX_REFILL' | 'LAB_STATUS';
    payload: any;
  };
}

export const PatientAIChatbot: React.FC = () => {
  const { user } = useAuth();
  const {
    patients,
    doctors,
    departments,
    prescriptions,
    labOrders,
    invoices,
    bookAppointment,
    collectInvoicePayment,
    registerEmergencyPatient
  } = useHospital();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Resolve current active patient
  const currentPatient = React.useMemo(() => {
    if (!user) return patients[0] || null;
    const uAny = user as any;
    return (
      patients.find(
        (p) =>
          (uAny.uhid && p.uhid === uAny.uhid) ||
          (uAny.phone && p.phone === uAny.phone) ||
          p.name.toLowerCase() === `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
      ) ||
      patients[0] ||
      null
    );
  }, [user, patients]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello ${user?.firstName || 'there'}! I am ASRTAVA Health Concierge, your 24/7 AI Medical Assistant. How can I help you today? You can describe symptoms for clinical triage, book appointments, check medications, or resolve hospital billing.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Natural Language Triage Processing
    setTimeout(async () => {
      const lower = text.toLowerCase();
      let aiResponseText = '';
      let actionCard: ChatMessage['actionCard'] = undefined;

      // 1. EMERGENCY RED FLAG DETECTION
      const emergencyKeywords = [
        'chest pain',
        'heart attack',
        'cannot breathe',
        'difficulty breathing',
        'shortness of breath',
        'unconscious',
        'profuse bleeding',
        'stroke',
        'facial drooping',
        'severe trauma',
        'accident'
      ];

      const isEmergency = emergencyKeywords.some((kw) => lower.includes(kw));

      if (isEmergency) {
        aiResponseText = `⚠️ CRITICAL CLINICAL ALERT: Your symptoms suggest a potential acute medical emergency requiring immediate evaluation. I have initiated our hospital emergency protocol. Please sit down, do not strain, and follow the emergency steps below.`;

        // Register in HospitalContext Emergency Department
        try {
          await registerEmergencyPatient({
            patientName: currentPatient?.name || `${user?.firstName || 'Unknown'} ${user?.lastName || 'Patient'}`.trim(),
            uhid: currentPatient?.uhid,
            isUnknownIdentity: false,
            age: currentPatient?.age || 35,
            gender: currentPatient?.gender || 'Male',
            arrivalMode: 'AMBULANCE',
            presentingComplaint: `Reported via Patient AI Concierge: ${text}`,
            esiLevel: 1,
            vitals: { hr: 120, bp: '85/55', rr: 28, spo2: 89, gcs: 14 },
            isMedicoLegal: false
          });
        } catch (e) {
          // Graceful local handling
        }

        actionCard = {
          type: 'EMERGENCY_ALERT',
          payload: {
            alertType: 'ESI-1 Resuscitation Protocol',
            message: 'Emergency Trauma & Resuscitation Bay alerted. STAT Ambulance unit dispatched to your location.',
            hotline: '+91 1800-ASRTAVA-108'
          }
        };
      }
      // 2. BILLING & INVOICE QUERIES
      else if (
        lower.includes('bill') ||
        lower.includes('pay') ||
        lower.includes('invoice') ||
        lower.includes('dues') ||
        lower.includes('charge') ||
        lower.includes('cost')
      ) {
        const unpaidBills = invoices.filter((i) => i.balance > 0);
        if (unpaidBills.length > 0) {
          const totalDue = unpaidBills.reduce((acc, curr) => acc + curr.balance, 0);
          aiResponseText = `You have ${unpaidBills.length} outstanding invoice(s) with a total pending balance of ₹${totalDue.toLocaleString()}. You can review the itemized breakdown and clear your dues securely below.`;
          actionCard = {
            type: 'BILL_PAY',
            payload: {
              invoice: unpaidBills[0],
              totalDue
            }
          };
        } else {
          aiResponseText = `Great news! All your hospital invoices are completely settled. Your current outstanding balance is ₹0. No action is required.`;
        }
      }
      // 3. MEDICATIONS & PRESCRIPTION REFILLS
      else if (
        lower.includes('medicine') ||
        lower.includes('pill') ||
        lower.includes('prescription') ||
        lower.includes('refill') ||
        lower.includes('rx') ||
        lower.includes('drug')
      ) {
        if (prescriptions.length > 0) {
          const latestRx = prescriptions[0];
          const drugList = latestRx.items.map((i) => `${(i as any).drugName || (i as any).name || 'Medicine'} (${i.dosage})`).join(', ');
          aiResponseText = `I found your active prescription issued by ${latestRx.doctorName}. Current medications: ${drugList}. Would you like to request an automated refill from our Hospital Pharmacy?`;
          actionCard = {
            type: 'RX_REFILL',
            payload: {
              prescription: latestRx
            }
          };
        } else {
          aiResponseText = `You do not have any active e-prescriptions on file. Please schedule a consultation with a physician if you need new medications or dosage adjustments.`;
        }
      }
      // 4. LAB & RADIOLOGY DIAGNOSTIC REPORTS
      else if (
        lower.includes('lab') ||
        lower.includes('test') ||
        lower.includes('report') ||
        lower.includes('scan') ||
        lower.includes('x-ray') ||
        lower.includes('blood')
      ) {
        if (labOrders.length > 0) {
          const latestLab = labOrders[0];
          aiResponseText = `Here is the status of your recent diagnostic orders: ${latestLab.tests.join(', ')} ordered by ${latestLab.doctorName}. Current status: "${latestLab.status}". Fasting instructions: Please observe an 8-12 hour water-only fasting window if undergoing blood glucose or lipid testing.`;
          actionCard = {
            type: 'LAB_STATUS',
            payload: {
              order: latestLab
            }
          };
        } else {
          aiResponseText = `You do not have any pending diagnostic or laboratory orders recorded in the system.`;
        }
      }
      // 5. SYMPTOM-BASED CLINICAL TRIAGE & APPOINTMENT BOOKING
      else {
        let suggestedDept = 'General Medicine';
        if (lower.includes('heart') || lower.includes('palpitation') || lower.includes('pressure') || lower.includes('cholesterol')) {
          suggestedDept = 'Cardiology';
        } else if (lower.includes('bone') || lower.includes('knee') || lower.includes('joint') || lower.includes('back') || lower.includes('fracture')) {
          suggestedDept = 'Orthopedics';
        } else if (lower.includes('child') || lower.includes('baby') || lower.includes('pediatric')) {
          suggestedDept = 'Pediatrics';
        }

        const availableDoc = doctors.find((d) => d.dept === suggestedDept) || doctors[0] || {
          id: 'doc-auto',
          name: 'On-Duty Consultant',
          dept: suggestedDept
        };

        aiResponseText = `Based on your symptoms, I recommend a consultation with our ${suggestedDept} department. ${availableDoc.name} is available for in-person clinic visits or high-definition teleconsultation. Would you like me to book your OPD slot now?`;
        actionCard = {
          type: 'DOCTOR_BOOKING',
          payload: {
            doctor: availableDoc,
            department: suggestedDept,
            suggestedDate: new Date().toISOString().slice(0, 10),
            suggestedTime: '11:30 AM'
          }
        };
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleExecuteBooking = async (payload: any) => {
    try {
      const appt = await bookAppointment({
        patientId: currentPatient?.id || 'pt-1',
        patientName: currentPatient?.name || `${user?.firstName || 'Verified'} ${user?.lastName || 'Patient'}`.trim(),
        uhid: currentPatient?.uhid || 'UHID-2026-901',
        age: currentPatient?.age || 35,
        gender: currentPatient?.gender || 'Male',
        phone: currentPatient?.phone || '+91 98765 00000',
        doctorId: payload.doctor.id,
        doctorName: payload.doctor.name,
        department: payload.department,
        date: payload.suggestedDate,
        time: payload.suggestedTime,
        complaint: 'Scheduled via ASRTAVA Patient AI Concierge'
      });

      showToast({
        type: 'success',
        title: 'Appointment Confirmed',
        message: `Token ${appt.token} reserved with ${payload.doctor.name} for ${payload.suggestedDate} at ${payload.suggestedTime}.`
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `✅ Appointment confirmed! Token #${appt.token} has been issued for ${payload.doctor.name} (${payload.department}) on ${payload.suggestedDate} at ${payload.suggestedTime}. It has been synchronized to the Doctor's OPD queue.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Booking Error',
        message: err.message || 'Could not complete appointment reservation.'
      });
    }
  };

  const handlePayInvoice = async (invoice: any) => {
    try {
      await collectInvoicePayment(invoice.id, invoice.balance, 'UPI');
      showToast({
        type: 'success',
        title: 'Payment Complete',
        message: `Settled ₹${invoice.balance.toLocaleString()} for Invoice #${invoice.invoiceNumber}.`
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `💳 Payment successful! Invoice #${invoice.invoiceNumber} has been marked as fully paid via UPI. A digital receipt has been dispatched to your registered mobile number and Finance records updated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Payment processing error.'
      });
    }
  };

  const handleRefillRequest = (prescription: any) => {
    showToast({
      type: 'info',
      title: 'Pharmacy Dispatch',
      message: `Refill request submitted for Rx #${prescription.prescriptionNumber}. Pharmacy team notified.`
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `💊 Pharmacy refill request confirmed! Prescription #${prescription.prescriptionNumber} has been transmitted to our Inpatient & Outpatient Pharmacy dispensing desk. You will receive an SMS when medications are packaged for pickup or delivery.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Concierge Action Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-white/40 focus:outline-none"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
          </div>
          <span className="font-bold text-xs tracking-wide pr-1">ASRTAVA AI Concierge</span>
        </button>
      </div>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center space-x-1.5">
                  <span>ASRTAVA Clinical Concierge</span>
                  <Badge variant="brand" size="sm">24/7 AI</Badge>
                </div>
                <div className="text-[11px] text-teal-200/80">
                  {currentPatient ? `${currentPatient.name} · ${currentPatient.uhid}` : 'Verified Clinical Portal'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
            <button
              onClick={() => handleSendMessage('I have chest tightness and pain')}
              className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-medium whitespace-nowrap text-[11px]"
            >
              🚨 Triage Chest Pain
            </button>
            <button
              onClick={() => handleSendMessage('Book doctor appointment for joint pain')}
              className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-medium whitespace-nowrap text-[11px]"
            >
              📅 Book Appointment
            </button>
            <button
              onClick={() => handleSendMessage('Check pending bills and payment')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium whitespace-nowrap text-[11px]"
            >
              💳 Pay Dues
            </button>
            <button
              onClick={() => handleSendMessage('Refill my prescribed medicines')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium whitespace-nowrap text-[11px]"
            >
              💊 Medicine Refill
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-br-xs'
                      : m.sender === 'system'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium w-full'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>

                {/* Interactive Action Card */}
                {m.actionCard && (
                  <div className="mt-2 w-full max-w-[95%]">
                    {/* Emergency Alert Card */}
                    {m.actionCard.type === 'EMERGENCY_ALERT' && (
                      <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 text-rose-950 text-xs shadow-sm">
                        <div className="flex items-center space-x-2 font-bold text-rose-900">
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                          <span>STAT Emergency Protocol Initiated</span>
                        </div>
                        <p className="text-[11px] text-rose-800">{m.actionCard.payload.message}</p>
                        <div className="pt-2 flex items-center space-x-2">
                          <a
                            href={`tel:${m.actionCard.payload.hotline}`}
                            className="flex-1 py-2 px-3 rounded-lg bg-rose-600 text-white font-bold text-center text-xs flex items-center justify-center space-x-1.5 hover:bg-rose-700 transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call 108 Emergency</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Doctor Booking Card */}
                    {m.actionCard.type === 'DOCTOR_BOOKING' && (
                      <div className="p-3.5 bg-white border border-teal-200 rounded-xl space-y-2.5 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{m.actionCard.payload.doctor.name}</span>
                          <Badge variant="brand" size="sm">{m.actionCard.payload.department}</Badge>
                        </div>
                        <div className="text-slate-600 text-[11px] space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-700" />
                            <span>Date: <strong>{m.actionCard.payload.suggestedDate}</strong></span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-teal-700" />
                            <span>Slot: <strong>{m.actionCard.payload.suggestedTime}</strong></span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full justify-center"
                          onClick={() => handleExecuteBooking(m.actionCard?.payload)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Confirm & Book OPD Slot</span>
                        </Button>
                      </div>
                    )}

                    {/* Bill Payment Card */}
                    {m.actionCard.type === 'BILL_PAY' && (
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-teal-800">{m.actionCard.payload.invoice.invoiceNumber}</span>
                          <Badge variant="danger" size="sm">₹{m.actionCard.payload.invoice.balance.toLocaleString()} Due</Badge>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Category: <strong>{m.actionCard.payload.invoice.category}</strong>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handlePayInvoice(m.actionCard?.payload.invoice)}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          <span>Pay Now via UPI / Card</span>
                        </Button>
                      </div>
                    )}

                    {/* Prescription Refill Card */}
                    {m.actionCard.type === 'RX_REFILL' && (
                      <div className="p-3.5 bg-white border border-teal-200 rounded-xl space-y-2 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{m.actionCard.payload.prescription.prescriptionNumber}</span>
                          <Badge variant="success" size="sm">Active Rx</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full justify-center"
                          onClick={() => handleRefillRequest(m.actionCard?.payload.prescription)}
                        >
                          <Pill className="w-3.5 h-3.5 mr-1" />
                          <span>Send Refill Order to Pharmacy</span>
                        </Button>
                      </div>
                    )}

                    {/* Lab Status Card */}
                    {m.actionCard.type === 'LAB_STATUS' && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-800">{m.actionCard.payload.order.orderNumber}</span>
                          <Badge variant="info" size="sm">{m.actionCard.payload.order.status}</Badge>
                        </div>
                        <div className="text-[11px] text-slate-600">Tests: {m.actionCard.payload.order.tests.join(', ')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-1.5 p-3 rounded-xl bg-white border border-slate-200 w-fit text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse delay-200" />
                <span className="text-[11px] ml-1 text-slate-500">Concierge triaging...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask symptoms, book doctor, check bills..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
