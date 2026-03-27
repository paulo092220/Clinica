
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import Calendar from './components/Calendar';
import ServicesManager from './components/ServicesManager';
import Billing from './components/Billing';
import Settings from './components/Settings';
import Inventory from './components/Inventory';
import Investments from './components/Investments';
import FinancialDistribution from './components/FinancialDistribution';
import Statistics from './components/Statistics';
import ScheduleModal from './components/ScheduleModal';
import PatientModal from './components/PatientModal';
import CheckoutModal from './components/CheckoutModal';
import Login from './components/Login';
import { AppRoute, Appointment, Patient, TreatmentRecord, CommissionEntry, Service, PerformedService, FixedExpense, GalleryItem, UserRole, User, Currency, DistributionConfig, InventoryItem, Investment } from './types';
import { Icons } from './constants';
import { saveDirectoryHandle, loadDirectoryHandle, verifyPermission } from './utils/storage';

const STORAGE_KEY = 'noahs_agency_data_v4';
const SESSION_USER_KEY = 'noahs_agency_active_session_user_v4';
const AUTH_KEY = 'noahs_agency_is_authenticated_v4';

const DEFAULT_USERS: User[] = [
  { id: 'admin-01', name: 'Admin Principal', role: 'Administrador Clínico', roleType: 'ADMIN', avatar: 'https://picsum.photos/seed/admin/100/100', color: 'bg-slate-900', password: '123' },
  { id: 'doc-01', name: 'Dr. Ricardo Silva', role: 'Estomatólogo General', roleType: 'DENTIST', avatar: 'https://picsum.photos/seed/doc1/100/100', color: 'bg-sky-600', password: '456' },
  { id: 'doc-02', name: 'Dra. Elena Martínez', role: 'Ortodoncista', roleType: 'DENTIST', avatar: 'https://picsum.photos/seed/doc2/100/100', color: 'bg-indigo-600', password: '789' },
];

const DEFAULT_DISTRIBUTION: DistributionConfig = {
  investmentRecovery: 40,
  operatingCosts: 20,
  investorPartner: 15,
  doctorCommission: 25
};

const App: React.FC = () => {
  const loadInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error al cargar datos guardados:", e);
      }
    }
    return null;
  };

  const savedData = loadInitialData();

  const [users, setUsers] = useState<User[]>(savedData?.users || DEFAULT_USERS);
  
  const loadActiveSession = (currentUsers: User[]): User => {
    // Intentamos cargar de sessionStorage para que persista solo en la pestaña actual
    const savedId = sessionStorage.getItem(SESSION_USER_KEY);
    if (savedId) {
      const found = currentUsers.find((u: User) => u.id === savedId);
      if (found) return found;
    }
    return currentUsers[0];
  };

  // Usamos sessionStorage para el estado de autenticación: se borra al cerrar el navegador/pestaña
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(sessionStorage.getItem(AUTH_KEY) === 'true');
  const [activeUser, setActiveUser] = useState<User>(loadActiveSession(savedData?.users || DEFAULT_USERS));
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [appointments, setAppointments] = useState<Appointment[]>(savedData?.appointments || []);
  const [patients, setPatients] = useState<Patient[]>(savedData?.patients || []);
  const [services, setServices] = useState<Service[]>(savedData?.services || []);
  const [commissions, setCommissions] = useState<CommissionEntry[]>(savedData?.commissions || []);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(savedData?.fixedExpenses || []);
  const [inventory, setInventory] = useState<InventoryItem[]>(savedData?.inventory || []);
  const [investments, setInvestments] = useState<Investment[]>(savedData?.investments || []);
  const [distributionConfig, setDistributionConfig] = useState<DistributionConfig>(savedData?.distributionConfig || DEFAULT_DISTRIBUTION);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Appointment | null>(null);
  const [scheduleInitialData, setScheduleInitialData] = useState<{name?: string, time?: string}>({});
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [autosaveDir, setAutosaveDir] = useState<any>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'active' | 'error' | 'needs_permission'>('idle');

  // Migración para citas completadas antiguas sin precio
  useEffect(() => {
    let migrated = false;
    const updatedAppointments = appointments.map(a => {
      if (a.status === 'completed' && (!a.priceCUP || a.priceCUP === 0)) {
        const commission = commissions.find(c => 
          (c.appointmentId === a.id) || 
          (c.patientName === a.patientName && c.date === a.date)
        );
        if (commission) {
          migrated = true;
          return { ...a, priceCUP: commission.priceCUP, priceUSD: commission.priceUSD };
        }
      }
      return a;
    });

    if (migrated) {
      setAppointments(updatedAppointments);
    }
  }, []); // Solo se ejecuta al montar

  // Load autosave handle on mount
  useEffect(() => {
    loadDirectoryHandle().then(handle => {
      if (handle) {
        setAutosaveDir(handle);
        setAutosaveStatus('needs_permission');
      }
    });
  }, []);

  const dataRef = useRef({ users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments });
  useEffect(() => {
    dataRef.current = { users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments };
  }, [users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments]);

  // Autosave interval
  useEffect(() => {
    if (!autosaveDir || autosaveStatus !== 'active') return;

    const interval = setInterval(async () => {
      try {
        const hasPermission = await verifyPermission(autosaveDir);
        if (!hasPermission) {
          setAutosaveStatus('needs_permission');
          return;
        }
        const fileHandle = await autosaveDir.getFileHandle('noahs_agency_autosave.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(dataRef.current, null, 2));
        await writable.close();
        console.log('Autosave successful at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Autosave failed:', error);
        setAutosaveStatus('error');
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [autosaveDir, autosaveStatus]);

  // Persistencia de DATOS en localStorage (No se borran al cerrar)
  useEffect(() => {
    const dataToSave = {
      users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments]);

  // Persistencia de SESIÓN en sessionStorage (Se borran al cerrar la aplicación)
  useEffect(() => {
    sessionStorage.setItem(SESSION_USER_KEY, activeUser.id);
    sessionStorage.setItem(AUTH_KEY, isAuthenticated.toString());
  }, [activeUser, isAuthenticated]);

  const handleLogin = (user: User) => {
    setActiveUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (activeUser.id === updatedUser.id) {
      setActiveUser(updatedUser);
    }
  };

  const handleSetupAutosave = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await saveDirectoryHandle(handle);
      setAutosaveDir(handle);
      setAutosaveStatus('active');
      alert("Carpeta de autoguardado configurada correctamente. Se guardará una copia cada 1 minuto.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeAutosave = async () => {
    if (!autosaveDir) return;
    const hasPermission = await verifyPermission(autosaveDir);
    if (hasPermission) {
      setAutosaveStatus('active');
      alert("Autoguardado reanudado.");
    }
  };

  const handleUpdateGallery = (patientId: string, item: GalleryItem) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, gallery: [item, ...(p.gallery || [])] } : p));
  };

  const handleScheduleAppointment = (apptData: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...apptData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [...prev, newAppt]);
  };

  const handleConfirmAppointment = (appt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'confirmed' } : a));
    const exists = patients.find(p => p.id === appt.patientId || p.name.toLowerCase() === appt.patientName.toLowerCase());
    
    if (!exists) {
      const newPatient: Patient = {
        id: appt.patientId || Math.random().toString(36).substr(2, 9),
        name: appt.patientName,
        phone: '',
        age: appt.patientAge || 18,
        treatingDoctor: appt.doctorName || activeUser.name,
        lastVisit: appt.date,
        history: [],
        gallery: []
      };
      setPatients(prev => [newPatient, ...prev]);
    }
  };

  const processCheckout = (data: {
    services: PerformedService[];
    suppliesUsed: any[];
    observations: string;
    totalCUP: number;
    totalUSD: number;
    extraChargeCUP?: number;
    extraChargeUSD?: number;
    extraChargeReason?: string;
    paymentMethod: any;
    paidCurrency: Currency;
  }) => {
    if (!checkoutTarget) return;

    const patientName = checkoutTarget.patientName;
    const doctorName = checkoutTarget.doctorName || activeUser.name;

    const record: TreatmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      doctor: doctorName,
      observations: data.observations,
      amountPaidCUP: data.totalCUP,
      amountPaidUSD: data.totalUSD,
      extraChargeCUP: data.extraChargeCUP,
      extraChargeUSD: data.extraChargeUSD,
      extraChargeReason: data.extraChargeReason,
      paidCurrency: data.paidCurrency,
      paymentMethod: data.paymentMethod || checkoutTarget.paymentMethod,
      services: data.services,
      suppliesUsed: data.suppliesUsed,
      appointmentCreatedAt: checkoutTarget.createdAt
    };

    // Actualizar Inventario
    if (data.suppliesUsed && data.suppliesUsed.length > 0) {
      setInventory(prev => prev.map(item => {
        const used = data.suppliesUsed.find(u => u.itemId === item.id);
        if (used) {
          return {
            ...item,
            stock: item.stock - used.quantity,
            history: [{
              id: Math.random().toString(36).substr(2, 9),
              date: record.date,
              type: 'Out',
              quantity: used.quantity,
              note: `Uso en consulta de ${patientName}`,
              doctorName: doctorName
            }, ...item.history]
          };
        }
        return item;
      }));
    }

    const commission: CommissionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      appointmentId: checkoutTarget.id,
      doctorName: doctorName,
      patientName: patientName,
      treatmentType: data.services.map(s => s.name).join(', ') || 'Consulta',
      date: record.date,
      priceCUP: data.totalCUP,
      priceUSD: data.totalUSD,
      commissionPercentage: distributionConfig.doctorCommission,
      commissionCUP: data.totalCUP * (distributionConfig.doctorCommission / 100),
      commissionUSD: data.totalUSD * (distributionConfig.doctorCommission / 100),
      status: 'pending'
    };

    setCommissions(prev => [commission, ...prev]);

    let targetPatient = patients.find(p => p.id === checkoutTarget.patientId || p.name === checkoutTarget.patientName);
    
    if (!targetPatient) {
      const newPatient: Patient = {
        id: checkoutTarget.patientId || Math.random().toString(36).substr(2, 9),
        name: checkoutTarget.patientName,
        phone: '',
        age: checkoutTarget.patientAge,
        treatingDoctor: doctorName,
        lastVisit: record.date,
        history: [record],
        gallery: []
      };
      setPatients(prev => [newPatient, ...prev]);
    } else {
      setPatients(prev => prev.map(p => p.id === targetPatient!.id ? { 
        ...p, 
        history: [record, ...(p.history || [])], 
        lastVisit: record.date 
      } : p));
    }

    setAppointments(prev => prev.map(a => a.id === checkoutTarget.id ? { ...a, status: 'completed', priceCUP: data.totalCUP, priceUSD: data.totalUSD } : a));
    setIsCheckoutModalOpen(false);
    setCheckoutTarget(null);
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleSavePatient = (patient: Patient) => {
    const exists = patients.find(p => p.id === patient.id);
    if (exists) {
      setPatients(patients.map(p => p.id === patient.id ? { ...patient, history: patient.history || [], gallery: patient.gallery || [] } : p));
    } else {
      setPatients([{ ...patient, history: [], gallery: [] }, ...patients]);
    }
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleUpdatePatientObject = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleAddHistoryRecord = (patientId: string, record: TreatmentRecord) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // Actualizar Inventario
    if (record.suppliesUsed && record.suppliesUsed.length > 0) {
      setInventory(prev => prev.map(item => {
        const used = record.suppliesUsed?.find(u => u.itemId === item.id);
        if (used) {
          return {
            ...item,
            stock: item.stock - used.quantity,
            history: [{
              id: Math.random().toString(36).substr(2, 9),
              date: record.date,
              type: 'Out',
              quantity: used.quantity,
              note: `Uso en sesión de ${patient.name}`,
              doctorName: record.doctor
            }, ...item.history]
          };
        }
        return item;
      }));
    }

    const commission: CommissionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      doctorName: record.doctor,
      patientName: patient.name,
      treatmentType: record.services.map(s => s.name).join(', ') || 'Procedimiento Manual',
      date: record.date,
      priceCUP: record.amountPaidCUP,
      priceUSD: record.amountPaidUSD,
      commissionPercentage: distributionConfig.doctorCommission,
      commissionCUP: record.amountPaidCUP * (distributionConfig.doctorCommission / 100),
      commissionUSD: record.amountPaidUSD * (distributionConfig.doctorCommission / 100),
      status: 'pending'
    };
    setCommissions(prev => [commission, ...prev]);

    setPatients(prev => prev.map(p => p.id === patientId ? { 
      ...p, 
      history: [record, ...(p.history || [])], 
      lastVisit: record.date 
    } : p));
  };

  const handleResetApp = () => {
    setUsers(DEFAULT_USERS);
    setAppointments([]);
    setPatients([]);
    setServices([]);
    setCommissions([]);
    setFixedExpenses([]);
    setInventory([]);
    setInvestments([]);
    setDistributionConfig(DEFAULT_DISTRIBUTION);
    setActiveUser(DEFAULT_USERS[0]);
    setIsAuthenticated(false);
    setCurrentRoute(AppRoute.DASHBOARD);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    alert("La aplicación ha sido restablecida de fábrica.");
  };

  const handleExport = () => {
    const dataToSave = {
      users, appointments, patients, services, commissions, fixedExpenses, distributionConfig, inventory, investments
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_noahs_agency_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.users) setUsers(data.users);
      if (data.appointments) setAppointments(data.appointments);
      if (data.patients) setPatients(data.patients);
      if (data.services) setServices(data.services);
      if (data.commissions) setCommissions(data.commissions);
      if (data.fixedExpenses) setFixedExpenses(data.fixedExpenses);
      if (data.distributionConfig) setDistributionConfig(data.distributionConfig);
      if (data.inventory) setInventory(data.inventory);
      if (data.investments) setInvestments(data.investments);
      alert("Datos restaurados correctamente.");
    } catch (e) {
      console.error("Error al importar datos:", e);
      alert("Error al importar el archivo. Asegúrese de que sea un JSON válido.");
    }
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return (
          <Dashboard 
            activeUser={activeUser} 
            onScheduleNew={() => setIsScheduleModalOpen(true)} 
            onNavigate={setCurrentRoute} 
            appointments={appointments} 
            services={services} 
            patients={patients}
            fixedExpenses={fixedExpenses}
            distributionConfig={distributionConfig}
            users={users}
            onUpdateAppointment={handleUpdateAppointment} 
            onConfirmAppointment={handleConfirmAppointment} 
          />
        );
      case AppRoute.PATIENTS:
        return <PatientList patients={patients} appointments={appointments} services={services} inventory={inventory} activeUser={activeUser} onAddPatient={() => setIsPatientModalOpen(true)} onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }} onDeletePatient={(id) => setPatients(patients.filter(p => p.id !== id))} onAddHistory={handleAddHistoryRecord} onUpdateGallery={handleUpdateGallery} onUpdatePatientObject={handleUpdatePatientObject} />;
      case AppRoute.CALENDAR:
        return <Calendar appointments={appointments} onSlotClick={(time) => { setScheduleInitialData({ time }); setIsScheduleModalOpen(true); }} onUpdateAppointment={handleUpdateAppointment} onDeleteAppointment={(id) => setAppointments(prev => prev.filter(a => a.id !== id))} onConfirmAppointment={handleConfirmAppointment} onStartCheckout={(appt) => { setCheckoutTarget(appt); setIsCheckoutModalOpen(true); }} />;
      case AppRoute.BILLING:
        return <Billing patients={patients} appointments={appointments} />;
      case AppRoute.SERVICES:
        return <ServicesManager services={services} onAddService={(s) => setServices([...services, s])} onUpdateService={(s) => setServices(services.map(old => old.id === s.id ? s : old))} onDeleteService={(id) => setServices(services.filter(s => s.id !== id))} />;
      case AppRoute.INVENTORY:
        return <Inventory inventory={inventory} onUpdateInventory={(item) => {
          const exists = inventory.find(i => i.id === item.id);
          if (exists) setInventory(inventory.map(i => i.id === item.id ? item : i));
          else setInventory([item, ...inventory]);
        }} onDeleteItem={(id) => setInventory(inventory.filter(i => i.id !== id))} activeUser={activeUser} />;
      case AppRoute.INVESTMENTS:
        return <Investments 
          investments={investments} 
          onUpdateInvestment={(inv) => {
            const exists = investments.find(i => i.id === inv.id);
            if (exists) setInvestments(investments.map(i => i.id === inv.id ? inv : i));
            else setInvestments([inv, ...investments]);
          }} 
          onDeleteInvestment={(id) => setInvestments(investments.filter(i => i.id !== id))} 
          fixedExpenses={fixedExpenses}
          onUpdateFixedExpense={(exp) => {
            const exists = fixedExpenses.find(e => e.id === exp.id);
            if (exists) setFixedExpenses(fixedExpenses.map(e => e.id === exp.id ? exp : e));
            else setFixedExpenses([exp, ...fixedExpenses]);
          }}
          onDeleteFixedExpense={(id) => setFixedExpenses(fixedExpenses.filter(e => e.id !== id))}
          activeUser={activeUser} 
        />;
      case AppRoute.FINANCIAL_DISTRIBUTION:
        return <FinancialDistribution 
          investments={investments}
          fixedExpenses={fixedExpenses}
          appointments={appointments}
          commissions={commissions}
          activeUser={activeUser}
          patients={patients}
          distributionConfig={distributionConfig}
          onUpdateConfig={setDistributionConfig}
        />;
      case AppRoute.STATISTICS:
        return <Statistics 
          appointments={appointments}
          patients={patients}
          services={services}
          activeUser={activeUser}
        />;
      case AppRoute.SETTINGS:
        return <Settings 
          activeUser={activeUser} 
          users={users} 
          onAddUser={(u) => setUsers([...users, u])} 
          onUpdateUser={handleUpdateUser}
          onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} 
          onExport={handleExport} 
          onImport={handleImport} 
          onReset={handleResetApp} 
          onLogout={handleLogout} 
          onSetupAutosave={handleSetupAutosave}
          onResumeAutosave={handleResumeAutosave}
          autosaveStatus={autosaveStatus}
        />;
      default:
        return <Dashboard activeUser={activeUser} onNavigate={setCurrentRoute} appointments={appointments} services={services} patients={patients} onConfirmAppointment={handleConfirmAppointment} />;
    }
  };

  if (!isAuthenticated) {
    return <Login users={users} onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${activeUser.color} rounded-lg flex items-center justify-center text-white shadow-md`}>
            <Icons.Stethoscope />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">Noah’s <span className="text-sky-600">Agency</span></span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
        >
          <Icons.Menu />
        </button>
      </header>

      <Sidebar 
        currentRoute={currentRoute} 
        onNavigate={setCurrentRoute} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeUser={activeUser}
        users={users}
        onSwitchUser={setActiveUser}
      />
      <main className="flex-1 pt-20 lg:pt-8 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => { setIsScheduleModalOpen(false); setScheduleInitialData({}); }} 
        onConfirm={handleScheduleAppointment} 
        services={services}
        patients={patients}
        activeUser={activeUser}
        initialPatientName={scheduleInitialData.name}
        initialTime={scheduleInitialData.time}
      />
      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
        onConfirm={handleSavePatient} 
        initialData={editingPatient}
        activeUser={activeUser}
      />
      {checkoutTarget && <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} appointment={checkoutTarget} services={services} inventory={inventory} onConfirm={processCheckout} />}
    </div>
  );
};

export default App;
