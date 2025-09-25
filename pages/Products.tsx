
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext.ts';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useToast } from '../hooks/useToast.ts';
import { DollarSign } from 'lucide-react';

const CafeteriaPage: React.FC = () => {
    const { currentUser, findSchool, recordCafeteriaUsage } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [checkedStudentIds, setCheckedStudentIds] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const paidForToday = useMemo(() => {
        if (!school) return new Set();
        const paid = new Set<string>();
        school.cafeteriaPayments.forEach(payment => {
            if (payment.dates.includes(selectedDate)) {
                paid.add(payment.studentId);
            }
        });
        return paid;
    }, [school, selectedDate]);
    
    useEffect(() => {
        if (school) {
            const usedToday = new Set<string>();
            (school.cafeteriaUsage || []).forEach(usage => {
                if (usage.date === selectedDate) {
                    usedToday.add(usage.studentId);
                }
            });
            setCheckedStudentIds(usedToday);
            setIsDirty(false); // Reset dirty state on date change
        }
    }, [school, selectedDate]);

    const filteredStudents = useMemo(() => {
        if (!school) return [];
        return school.students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [school, searchTerm]);


    const handleCheckChange = (studentId: string) => {
        setCheckedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
        setIsDirty(true);
    };
    
    const handleSave = async () => {
        if (!school) return;
        await recordCafeteriaUsage(school.id, Array.from(checkedStudentIds), selectedDate);
        setIsDirty(false);
        showToast(t('usageSavedSuccess'), 'success');
    };

    if (!school) return <div>Loading...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cafeteriaUsage')}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                     <input
                        type="text"
                        placeholder={t('searchStudentByName')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 text-base text-gray-900 bg-gray-100 border border-transparent rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 text-base text-gray-900 bg-gray-100 border border-transparent rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isDirty && (
                        <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow">
                            {t('saveUsage')}
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('student')}</th>
                            <th scope="col" className="px-6 py-3">{t('level')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => {
                             const level = school.levels.find(l => l.id === student.levelId);
                             const hasPaid = paidForToday.has(student.id);
                             const isChecked = checkedStudentIds.has(student.id);

                             return (
                                <tr key={student.id} className={`border-b dark:border-gray-700 transition-colors ${isChecked ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600/20'}`}>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {student.name}
                                    </th>
                                    <td className="px-6 py-4">{level?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-center">
                                       {hasPaid ? (
                                            <span title={t('paidForThisDay')} className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400">
                                                <DollarSign size={16} />
                                                <span className="font-semibold">{t('paid')}</span>
                                            </span>
                                       ) : (
                                            <span title={t('notPaidForThisDay')} className="flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400">
                                                <DollarSign size={16} />
                                                <span className="font-semibold">{t('unpaid')}</span>
                                            </span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <label htmlFor={`check-${student.id}`} className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                            <input
                                                id={`check-${student.id}`}
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isChecked}
                                                onChange={() => handleCheckChange(student.id)}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                        </label>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredStudents.length === 0 && (
                     <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                         <p>{t('noStudentsFound')}</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default CafeteriaPage;
