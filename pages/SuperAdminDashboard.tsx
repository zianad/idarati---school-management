

import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext.ts';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/Modal.tsx';
import { School } from '../types/index.ts';
import { LogOut, Trash2, PlusCircle, LogIn, ShieldCheck } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
);

const SuperAdminDashboard: React.FC = () => {
    const { schools, addSchool, deleteSchool, logout, toggleSchoolStatus, impersonateSchoolOwner, activateSchoolPermanently } = useAppContext();
    const { t, dir } = useLanguage();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolLogo, setNewSchoolLogo] = useState<string | null>(null);
    const [newOwnerCode, setNewOwnerCode] = useState('');
    const [newStaffCode, setNewStaffCode] = useState('');
    const [trialDays, setTrialDays] = useState(30);

    const resetForm = () => {
        setNewSchoolName('');
        setNewSchoolLogo(null);
        setNewOwnerCode('');
        setNewStaffCode('');
        setTrialDays(30);
    };

    const handleCloseModal = () => {
        resetForm();
        setIsModalOpen(false);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewSchoolLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSchoolName.trim() && newSchoolLogo && newOwnerCode.trim() && newStaffCode.trim()) {
            await addSchool({
                name: newSchoolName.trim(),
                logo: newSchoolLogo,
                ownerCode: newOwnerCode.trim(),
                staffCode: newStaffCode.trim(),
                trialDays: trialDays
            });
            handleCloseModal();
            showToast(t('addSuccess'), 'success');
        } else {
            showToast(t('fillAllFields'), 'error');
        }
    };

    const handleDeleteSchool = async (schoolId: string) => {
        if (window.confirm(t('confirmDelete'))) {
            await deleteSchool(schoolId);
            showToast(t('deleteSuccess'), 'info');
        }
    };
    
    const handleToggleSchool = async (schoolId: string) => {
        await toggleSchoolStatus(schoolId);
        showToast(t('statusUpdatedSuccess'), 'success');
    };

    const handleActivatePermanently = async (schoolId: string) => {
        if (window.confirm(t('confirmPermanentActivation'))) {
            await activateSchoolPermanently(schoolId);
            showToast(t('activationSuccess'), 'success');
        }
    };

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div dir={dir} className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('superAdminDashboard')}</h1>
                <button onClick={logout} className="flex items-center space-x-2 rtl:space-x-reverse text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-2 rounded-lg transition-colors">
                    <LogOut size={20} />
                    <span>{t('logout')}</span>
                </button>
            </header>

            <main className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('registeredSchools')}</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <PlusCircle size={20} />
                        <span>{t('addNewSchool')}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schools.map((school: School) => (
                        <div key={school.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${!school.isActive ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                    <img src={school.logo} alt={`${school.name} logo`} className="w-16 h-16 rounded-full object-cover" />
                                    <div>
                                        <h3 className="text-lg font-bold">{school.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {school.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => impersonateSchoolOwner(school.id)}
                                        disabled={!school.isActive}
                                        title={t('manageSchool')}
                                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <LogIn size={20} />
                                    </button>
                                    <button onClick={() => handleDeleteSchool(school.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                <p><strong className="font-semibold">{t('ownerCode')}:</strong> <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{school.ownerCode}</code></p>
                                <p><strong className="font-semibold">{t('staffCode')}:</strong> <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{school.staffCode}</code></p>
                                <div className="flex justify-between items-center">
                                    <strong className="font-semibold">{t('schoolStatus')}:</strong>
                                    <div className="flex items-center gap-2">
                                        <ToggleSwitch checked={school.isActive} onChange={() => handleToggleSchool(school.id)} />
                                        <span className={`font-semibold text-sm ${school.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {school.isActive ? t('active') : t('inactive')}
                                        </span>
                                    </div>
                                </div>
                                {school.isActive && school.trialEndDate && new Date(school.trialEndDate) >= new Date() ? (
                                    <div className="mt-2 text-center text-sm text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-lg space-y-2">
                                         <p>{t('trialEndsOn', { date: new Date(school.trialEndDate).toLocaleDateString() })}</p>
                                         <button 
                                            onClick={() => handleActivatePermanently(school.id)}
                                            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-2 rounded-md text-xs transition-colors"
                                        >
                                            <ShieldCheck size={14} />
                                            {t('activatePermanently')}
                                        </button>
                                    </div>
                                ) : !school.trialEndDate && school.isActive ? (
                                    <div className="mt-2 text-center text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/50 p-2 rounded-lg flex items-center justify-center gap-2">
                                        <ShieldCheck size={16} />
                                        <span>{t('active')}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={t('addNewSchool')}>
                <form onSubmit={handleAddSchool} className="space-y-4">
                    <div>
                        <label htmlFor="school-name" className={labelClass}>{t('schoolName')}</label>
                        <input
                            id="school-name"
                            type="text"
                            value={newSchoolName}
                            onChange={(e) => setNewSchoolName(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="owner-code" className={labelClass}>{t('ownerCode')}</label>
                        <input
                            id="owner-code"
                            type="text"
                            value={newOwnerCode}
                            onChange={(e) => setNewOwnerCode(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="staff-code" className={labelClass}>{t('staffCode')}</label>
                        <input
                            id="staff-code"
                            type="text"
                            value={newStaffCode}
                            onChange={(e) => setNewStaffCode(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="trial-days" className={labelClass}>{t('trialPeriodDays')}</label>
                        <input
                            id="trial-days"
                            type="number"
                            value={trialDays}
                            onChange={(e) => setTrialDays(Number(e.target.value))}
                            className={inputClass}
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('schoolLogo')}</label>
                        <div className="mt-2 flex items-center space-x-4 rtl:space-x-reverse">
                            {newSchoolLogo && <img src={newSchoolLogo} alt="Logo Preview" className="w-16 h-16 rounded-full object-cover" />}
                            <label htmlFor="school-logo-upload" className="cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <span>{t('upload')}</span>
                                <input id="school-logo-upload" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{t('add')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
