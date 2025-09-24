


import React, { useState, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext.ts';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useToast } from '../hooks/useToast.ts';
import { School, UserRole } from '../types/index.ts';

const Settings: React.FC = () => {
    const { currentUser, findSchool, updateSchoolDetails, updateSchoolCodes, updateSchoolFees, schools, restoreData } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    
    if (currentUser?.role !== UserRole.SchoolOwner) {
        return <Navigate to="/" replace />;
    }

    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);
    const importFileRef = useRef<HTMLInputElement>(null);

    const [schoolName, setSchoolName] = useState(school?.name || '');
    const [schoolLogo, setSchoolLogo] = useState<string | null>(school?.logo || null);
    const [ownerCode, setOwnerCode] = useState(school?.ownerCode || '');
    const [staffCode, setStaffCode] = useState(school?.staffCode || '');
    const [fees, setFees] = useState({
        transportationFee: school?.transportationFee || 0,
        cafeteriaDailyFee: school?.cafeteriaDailyFee || 0,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSchoolLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId && schoolName && schoolLogo) {
            updateSchoolDetails(currentUser.schoolId, { name: schoolName, logo: schoolLogo });
            showToast(t('infoUpdatedSuccess'), 'success');
        } else {
            showToast(t('fillAllFields'), 'error');
        }
    }
    
    const handleCodesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId && ownerCode && staffCode) {
            updateSchoolCodes(currentUser.schoolId, { ownerCode, staffCode });
            showToast(t('codesUpdatedSuccess'), 'success');
        }
    }

    const handleFeesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId) {
            updateSchoolFees(currentUser.schoolId, fees);
            showToast(t('infoUpdatedSuccess'), 'success');
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify({ schools }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `idarati-backup-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (window.confirm(t('importConfirm'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result;
                    if (typeof text !== 'string') {
                        throw new Error("File content is not readable");
                    }
                    const data = JSON.parse(text);
                    if (data && Array.isArray(data.schools)) {
                        restoreData(data);
                        showToast(t('importSuccess'), 'success');
                        // Optionally force a reload to ensure all components refresh with new data
                        window.location.reload();
                    } else {
                        throw new Error("Invalid file structure");
                    }
                } catch (error) {
                    console.error("Import failed:", error);
                    showToast(t('importError'), 'error');
                }
            };
            reader.readAsText(file);
        }
        // Reset the input value to allow importing the same file again
        e.target.value = '';
    };

    if (!school) {
        return <div>Loading...</div>;
    }
    
    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";
    const cardClass = "bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg";
    const buttonClass = "w-full sm:w-auto px-6 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('settings')}</h1>

            {/* School Info Card */}
            <div className={cardClass}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('schoolInfo')}</h2>
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="school-name" className={labelClass}>{t('schoolName')}</label>
                        <input id="school-name" type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                        <label className={labelClass}>{t('schoolLogo')}</label>
                        <div className="mt-2 flex items-center space-x-4 rtl:space-x-reverse">
                            {schoolLogo && <img src={schoolLogo} alt="Logo Preview" className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-800 p-1" />}
                            <label htmlFor="school-logo-upload" className="cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <span>{t('upload')}</span>
                                <input id="school-logo-upload" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className={buttonClass}>{t('updateInfo')}</button>
                    </div>
                </form>
            </div>
            
            {/* Service Fees Card */}
            <div className={cardClass}>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('serviceFees')}</h2>
                 <form onSubmit={handleFeesSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="transport-fee" className={labelClass}>{t('transportationFee')} ({t('monthly')})</label>
                            <input id="transport-fee" type="number" value={fees.transportationFee} onChange={e => setFees({...fees, transportationFee: Number(e.target.value)})} className={inputClass} required min="0" />
                        </div>
                        <div>
                            <label htmlFor="cafeteria-fee" className={labelClass}>{t('cafeteriaFee')} ({t('daily')})</label>
                            <input id="cafeteria-fee" type="number" value={fees.cafeteriaDailyFee} onChange={e => setFees({...fees, cafeteriaDailyFee: Number(e.target.value)})} className={inputClass} required min="0" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className={buttonClass}>{t('save')}</button>
                    </div>
                 </form>
            </div>
            
            {/* Security Settings Card */}
            <div className={cardClass}>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('securitySettings')}</h2>
                 <form onSubmit={handleCodesSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="owner-code" className={labelClass}>{t('ownerCode')}</label>
                        <input id="owner-code" type="text" value={ownerCode} onChange={e => setOwnerCode(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                        <label htmlFor="staff-code" className={labelClass}>{t('staffCode')}</label>
                        <input id="staff-code" type="text" value={staffCode} onChange={e => setStaffCode(e.target.value)} className={inputClass} required />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className={buttonClass}>{t('updateCodes')}</button>
                    </div>
                 </form>
            </div>

            {/* Data Management Card */}
            <div className={cardClass}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('dataManagement')}</h2>
                <div className="space-y-6">
                    {/* Export */}
                    <div>
                        <h3 className="font-semibold">{t('exportData')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('exportDescription')}</p>
                        <button onClick={handleExport} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                            {t('exportData')}
                        </button>
                    </div>
                    {/* Import */}
                    <div>
                        <h3 className="font-semibold">{t('importData')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('importDescription')}</p>
                        <button onClick={handleImportClick} className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                            {t('importData')}
                        </button>
                        <input
                            type="file"
                            ref={importFileRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleFileImport}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;