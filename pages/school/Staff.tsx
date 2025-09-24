
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserRole, StaffMember } from '../../types/index.ts';
import Modal from '../../components/Modal.tsx';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const Staff: React.FC = () => {
    const { currentUser, findSchool, addStaffMember, updateStaffMember, deleteStaffMember } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        role: 'admin' as 'admin' | 'driver',
        salary: 0,
    });

    const handleOpenModal = (staff: StaffMember | null = null) => {
        setEditingStaff(staff);
        if (staff) {
            setFormData({ name: staff.name, role: staff.role, salary: staff.salary });
        } else {
            setFormData({ name: '', role: 'admin', salary: 0 });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.schoolId) return;

        if (!formData.name || formData.salary <= 0) {
            showToast(t('fillAllFields'), 'error');
            return;
        }

        if (editingStaff) {
            updateStaffMember(currentUser.schoolId, { ...editingStaff, ...formData });
             showToast(t('editSuccess'), 'success');
        } else {
            addStaffMember(currentUser.schoolId, formData);
             showToast(t('addSuccess'), 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (staffId: string) => {
        if(window.confirm(t('confirmDelete')) && currentUser?.schoolId) {
            deleteStaffMember(currentUser.schoolId, staffId);
            showToast(t('deleteSuccess'), 'info');
        }
    }

    if (!school) return <div>Loading...</div>;

    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isOwner = currentUser?.role === UserRole.SchoolOwner;
    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";
    
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('staffList')}</h2>
                {isOwner && (
                    <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <PlusCircle size={20} />
                        <span>{t('addNewStaff')}</span>
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('name')}</th>
                            <th scope="col" className="px-6 py-3">{t('staffRole')}</th>
                            {isOwner && <th scope="col" className="px-6 py-3">{t('monthlySalary')}</th>}
                            {isOwner && <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {school.staff.map(staffMember => (
                            <tr key={staffMember.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                 <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                                            {getInitials(staffMember.name)}
                                        </div>
                                        <div>
                                            {staffMember.name}
                                        </div>
                                    </div>
                                </th>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${staffMember.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                      {t(staffMember.role)}
                                    </span>
                                </td>
                                {isOwner && <td className="px-6 py-4">{staffMember.salary.toLocaleString()} MAD</td>}
                                {isOwner && (
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                                            <button onClick={() => handleOpenModal(staffMember)} className="text-blue-500 hover:text-blue-700"><Edit size={20} /></button>
                                            <button onClick={() => handleDelete(staffMember.id)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStaff ? t('editStaff') : t('addNewStaff')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>{t('name')}</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('staffRole')}</label>
                        <select 
                            value={formData.role} 
                            onChange={e => setFormData({ ...formData, role: e.target.value as any })} 
                            required 
                            className={inputClass}
                        >
                            <option value="admin">{t('admin')}</option>
                            <option value="driver">{t('driver')}</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>{t('monthlySalary')}</label>
                        <input 
                            type="number" 
                            value={formData.salary} 
                            onChange={e => setFormData({ ...formData, salary: Number(e.target.value)})} 
                            required 
                            min="0"
                            className={inputClass}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{t('save')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
