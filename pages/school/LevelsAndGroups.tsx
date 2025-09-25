

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { useToast } from '../../hooks/useToast.ts';
import Modal from '../../components/Modal.tsx';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

type ModalType = 'level' | 'group' | null;

const LevelsAndGroups: React.FC = () => {
    const { currentUser, findSchool, addLevel, addGroup, deleteLevel, deleteGroup } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);
    
    const [openModal, setOpenModal] = useState<ModalType>(null);
    const [levelName, setLevelName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedLevelId, setSelectedLevelId] = useState('');

    const isOwner = currentUser?.role === UserRole.SchoolOwner;

    const handleAddLevel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId && levelName) {
            await addLevel(currentUser.schoolId, { name: levelName });
            setLevelName('');
            setOpenModal(null);
            showToast(t('addSuccess'), 'success');
        }
    };
    
    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId && groupName && selectedLevelId) {
            await addGroup(currentUser.schoolId, { name: groupName, levelId: selectedLevelId });
            setGroupName('');
            setSelectedLevelId('');
            setOpenModal(null);
            showToast(t('addSuccess'), 'success');
        }
    };

    const createDeleteHandler = (deleteFunc: (schoolId: string, id: string) => Promise<void>) => async (id: string) => {
        if (window.confirm(t('confirmDelete')) && currentUser?.schoolId) {
            await deleteFunc(currentUser.schoolId, id);
            showToast(t('deleteSuccess'), 'info');
        }
    };

    const handleDeleteLevel = createDeleteHandler(deleteLevel);
    const handleDeleteGroup = createDeleteHandler(deleteGroup);

    if (!school) return <div>Loading...</div>;

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const deleteBtnClass = "text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('classes')}</h2>
                {isOwner && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button onClick={() => setOpenModal('level')} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">
                            <PlusCircle size={18}/> <span>{t('addNewLevel')}</span>
                        </button>
                        <button onClick={() => { setSelectedLevelId(school.levels[0]?.id || ''); setOpenModal('group'); }} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 text-sm font-semibold">
                            <PlusCircle size={18}/> <span>{t('addNewClass')}</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-6">
                {school.levels.map(level => (
                    <div key={level.id} className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{level.name}</h4>
                            {isOwner && <button onClick={() => handleDeleteLevel(level.id)} className={deleteBtnClass}><Trash2 size={20} /></button>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {school.groups.filter(g => g.levelId === level.id).map(group => (
                                <div key={group.id} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                    <span>{group.name}</span>
                                    {isOwner && <button onClick={() => handleDeleteGroup(group.id)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><X size={16} /></button>}
                                </div>
                            ))}
                             {school.groups.filter(g => g.levelId === level.id).length === 0 && (
                                 <p className="text-sm text-gray-500 dark:text-gray-400 px-1">{t('class')} فارغ</p>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            <Modal isOpen={openModal === 'level'} onClose={() => setOpenModal(null)} title={t('addNewLevel')}>
                <form onSubmit={handleAddLevel} className="space-y-4">
                    <label className={labelClass}>{t('levelName')}</label>
                    <input type="text" value={levelName} onChange={e => setLevelName(e.target.value)} required className={inputClass} />
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
                        <button type="button" onClick={() => setOpenModal(null)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{t('add')}</button>
                    </div>
                </form>
            </Modal>
             <Modal isOpen={openModal === 'group'} onClose={() => setOpenModal(null)} title={t('addNewClass')}>
                <form onSubmit={handleAddGroup} className="space-y-4">
                    <div>
                        <label className={labelClass}>{t('level')}</label>
                        <select value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)} required className={inputClass}>
                            <option value="" disabled>-- {t('level')} --</option>
                            {school.levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>{t('className')}</label>
                        <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} required className={inputClass} />
                    </div>
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
                        <button type="button" onClick={() => setOpenModal(null)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{t('add')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LevelsAndGroups;
