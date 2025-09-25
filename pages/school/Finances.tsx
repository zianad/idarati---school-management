

import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserRole, Expense } from '../../types/index.ts';
import StatCard from '../../components/StatCard.tsx';
import { DollarSign, TrendingDown, ChevronsUp, PlusCircle, Wallet, Bus, Utensils } from 'lucide-react';
import Modal from '../../components/Modal.tsx';

type FinanceTab = 'general' | 'transportation' | 'cafeteria';

const Finances: React.FC = () => {
    const { currentUser, findSchool, addExpense } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();

    if (currentUser?.role !== UserRole.SchoolOwner) {
        return <Navigate to="/" replace />;
    }

    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [activeTab, setActiveTab] = useState<FinanceTab>('general');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseData, setExpenseData] = useState({ description: '', amount: 0, category: 'other' as Expense['category'] });

    const financeData = useMemo(() => {
        if (!school) return {
            general: { income: 0, expenses: 0, incomeDetails: [], expenseDetails: [] },
            transportation: { income: 0, expenses: 0, incomeDetails: [], expenseDetails: [] },
            cafeteria: { income: 0, expenses: 0, incomeDetails: [], expenseDetails: [] },
        };
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // General Finances
        const tuitionIncomeDetails = school.students.map(student => {
            const subjectsFee = student.subjectIds.reduce((sum, subId) => {
                const subject = school.subjects.find(s => s.id === subId);
                return sum + (subject?.fee || 0);
            }, 0);
            return { name: student.name, amount: subjectsFee };
        }).filter(item => item.amount > 0);

        const tuitionIncome = tuitionIncomeDetails.reduce((sum, item) => sum + item.amount, 0);
        const teacherSalaries = school.teachers
            .filter(teacher => teacher.salary.type === 'fixed')
            .map(teacher => ({ description: `${t('salary')}: ${teacher.name}`, amount: teacher.salary.value }));
        const adminSalaries = school.staff
            .filter(s => s.role === 'admin')
            .map(s => ({ description: `${t('salary')}: ${s.name}`, amount: s.salary }));
            
        const generalExpenses = [...teacherSalaries, ...adminSalaries];
        const totalGeneralExpenses = generalExpenses.reduce((sum, item) => sum + item.amount, 0);

        // Transportation Finances
        const transportStudents = school.students.filter(s => s.hasTransportation);
        const transportIncome = transportStudents.length * school.transportationFee;
        const transportIncomeDetails = transportStudents.map(s => ({ description: s.name, amount: school.transportationFee }));
        
        const driverSalaries = school.staff
            .filter(s => s.role === 'driver')
            .map(s => ({ description: `${t('salary')}: ${s.name}`, amount: s.salary }));
        const otherTransportExpenses = school.expenses.filter(e => e.date.startsWith(currentMonth) && e.category === 'transport');
        const transportExpenses = [...driverSalaries, ...otherTransportExpenses];
        const totalTransportExpenses = transportExpenses.reduce((sum, item) => sum + item.amount, 0);

        // Cafeteria Finances
        const cafeteriaPaymentsThisMonth = school.cafeteriaPayments.filter(p => p.paymentDate.startsWith(currentMonth));
        const cafeteriaIncome = cafeteriaPaymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);
        const cafeteriaIncomeDetails = cafeteriaPaymentsThisMonth.map(p => {
            const student = school.students.find(s => s.id === p.studentId);
            return {
                description: `${student?.name || 'N/A'} (${p.dates.length} ${t('days')})`,
                amount: p.amount
            };
        });

        const cafeteriaExpenses = school.expenses.filter(e => e.date.startsWith(currentMonth) && e.category === 'cafeteria');
        const totalCafeteriaExpenses = cafeteriaExpenses.reduce((sum, item) => sum + item.amount, 0);

        return {
            general: { income: tuitionIncome, expenses: totalGeneralExpenses, incomeDetails: tuitionIncomeDetails.map(item => ({...item, description: item.name})), expenseDetails: generalExpenses },
            transportation: { income: transportIncome, expenses: totalTransportExpenses, incomeDetails: transportIncomeDetails, expenseDetails: transportExpenses },
            cafeteria: { income: cafeteriaIncome, expenses: totalCafeteriaExpenses, incomeDetails: cafeteriaIncomeDetails, expenseDetails: cafeteriaExpenses },
        };

    }, [school, t]);


    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.schoolId && expenseData.description && expenseData.amount > 0) {
            const date = new Date().toISOString().slice(0, 10);
            await addExpense(currentUser.schoolId, { ...expenseData, date });
            setExpenseData({ description: '', amount: 0, category: 'other' });
            setIsModalOpen(false);
            showToast(t('addSuccess'), 'success');
        }
    };

    if (!school) return <div>Loading...</div>;

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    const currentData = financeData[activeTab];
    const netProfit = currentData.income - currentData.expenses;
    
    const TabButton: React.FC<{ tab: FinanceTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center gap-3 w-full px-4 py-3 text-lg font-bold rounded-t-lg border-b-4 transition-all duration-200 ${
                activeTab === tab 
                ? 'text-blue-600 border-blue-600 bg-white dark:bg-gray-800' 
                : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-3 bg-gray-200 dark:bg-gray-900 rounded-t-lg">
                <TabButton tab="general" label={t('generalFinances')} icon={<Wallet size={24}/>} />
                <TabButton tab="transportation" label={t('transportationFinances')} icon={<Bus size={24}/>}/>
                <TabButton tab="cafeteria" label={t('cafeteriaFinances')} icon={<Utensils size={24}/>}/>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-b-2xl shadow-lg -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title={t('totalIncome')} value={`${currentData.income.toLocaleString()} MAD`} icon={<DollarSign size={24}/>} iconBgColor="bg-green-500"/>
                    <StatCard title={t('totalExpenses')} value={`${currentData.expenses.toLocaleString()} MAD`} icon={<TrendingDown size={24}/>} iconBgColor="bg-red-500"/>
                    <StatCard title={t('netProfit')} value={`${netProfit.toLocaleString()} MAD`} icon={<ChevronsUp size={24}/>} iconBgColor="bg-blue-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('incomeDetails')}</h3>
                        <div className="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 text-left rtl:text-right sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">{t('description')}</th>
                                        <th className="px-4 py-2">{t('amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.incomeDetails.map((item, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.description}</td>
                                            <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">{item.amount.toLocaleString()} MAD</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('expenseDetails')}</h3>
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 rtl:space-x-reverse bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-200"><PlusCircle size={16}/><span>{t('addExpense')}</span></button>
                        </div>
                        <div className="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 text-left rtl:text-right sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">{t('description')}</th>
                                        <th className="px-4 py-2">{t('amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.expenseDetails.map((item, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.description}</td>
                                            <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">{item.amount.toLocaleString()} MAD</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('addExpense')}>
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className={labelClass}>{t('expenseDescription')}</label>
                        <input type="text" value={expenseData.description} onChange={e => setExpenseData({ ...expenseData, description: e.target.value })} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('amount')}</label>
                        <input type="number" value={expenseData.amount} onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('category')}</label>
                        <select
                            value={expenseData.category}
                            onChange={e => setExpenseData({ ...expenseData, category: e.target.value as Expense['category'] })}
                            className={inputClass}
                        >
                            <option value="other">{t('other')}</option>
                            <option value="transport">{t('transport')}</option>
                            <option value="cafeteria">{t('cafeteria')}</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{t('add')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Finances;
