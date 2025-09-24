import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import StatCard from '../../components/StatCard.tsx';
import { Users, UserCog, UserX, Wallet, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { currentUser, findSchool } = useAppContext();
    const { t } = useLanguage();

    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const groupData = useMemo(() => {
        if (!school) return [];
        return school.groups.map(group => ({
            name: group.name,
            [t('students')]: school.students.filter(s => s.groupIds.includes(group.id)).length,
        })).filter(g => (g[t('students')] as number) > 0);
    }, [school, t]);

    const paymentAlerts = useMemo(() => {
        if (!school) return [];
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        return school.students.filter(student => {
            const hasPaid = school.payments.some(p => p.studentId === student.id && p.date === currentMonth);
            return !hasPaid;
        });
    }, [school]);

    const totalIncome = useMemo(() => {
        if (!school) return 0;
        return school.payments.reduce((acc, p) => acc + p.amount, 0);
    }, [school]);

    if (!school) {
        return <div>Loading school data...</div>;
    }
    
    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('totalStudents')} value={school.students.length} icon={<Users size={28} />} iconBgColor="bg-blue-500" />
                <StatCard title={t('totalTeachers')} value={school.teachers.length} icon={<UserCog size={28} />} iconBgColor="bg-pink-500" />
                <StatCard title={t('paymentAlerts')} value={paymentAlerts.length} icon={<UserX size={28} />} iconBgColor="bg-red-500" />
                <StatCard title={t('totalIncome')} value={`${totalIncome.toLocaleString()} MAD`} icon={<Wallet size={28} />} iconBgColor="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('studentsDistributionByClass')}</h3>
                    <div style={{height: '350px'}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis dataKey="name" tick={{ fontSize: 14, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 14, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                                        fontSize: '16px'
                                    }}
                                    cursor={{fill: 'rgba(156, 163, 175, 0.1)'}}
                                />
                                <Legend wrapperStyle={{ fontSize: '16px' }} />
                                <Bar dataKey={t('students')} fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('paymentAlerts')}</h3>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {paymentAlerts.length > 0 ? (
                            paymentAlerts.map(student => {
                                const level = school.levels.find(l => l.id === student.levelId);
                                return (
                                    <div key={student.id} className="flex items-center space-x-4 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 flex items-center justify-center font-bold text-lg">
                                            {getInitials(student.name)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base text-gray-900 dark:text-white">{student.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('level')}: {level?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                                <CheckCircle2 size={56} className="mb-3 text-green-500"/>
                                <p className="text-lg">{t('noPaymentAlerts')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;