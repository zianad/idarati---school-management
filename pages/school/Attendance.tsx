import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { AttendanceStatus } from '../../types/index.ts';

const AttendancePage: React.FC = () => {
    const { currentUser, findSchool } = useAppContext();
    const { t } = useLanguage();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    
    const attendanceRecords = useMemo(() => {
        if (!school) return [];
        return school.attendance
            .filter(att => att.date === selectedDate)
            .map(att => {
                const student = school.students.find(s => s.id === att.studentId);
                const session = school.scheduledSessions.find(s => s.id === att.sessionId);
                if (!session || !student) return null;

                if (selectedGroupId !== 'all' && session.groupId !== selectedGroupId) return null;

                const subject = session.subjectId ? school.subjects.find(s => s.id === session.subjectId) : null;
                const course = session.courseId ? school.courses.find(c => c.id === session.courseId) : null;
                const entity = subject || course;

                return {
                    ...att,
                    studentName: student.name,
                    groupName: school.groups.find(g => g.id === session.groupId)?.name || 'N/A',
                    sessionName: entity?.name || 'N/A',
                    sessionTime: session.timeSlot,
                };
            })
            .filter((record): record is NonNullable<typeof record> => record !== null)
            .sort((a, b) => a.sessionTime.localeCompare(b.sessionTime) || a.studentName.localeCompare(b.studentName));
    }, [school, selectedDate, selectedGroupId]);
    
    const getStatusBadge = (status: AttendanceStatus) => {
        const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
        switch (status) {
            case AttendanceStatus.Present: return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
            case AttendanceStatus.Absent: return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
            case AttendanceStatus.Late: return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
            case AttendanceStatus.Excused: return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
            default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
        }
    };

    if (!school) return <div>Loading...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('attendanceReport')}</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 text-base text-gray-900 bg-gray-100 border border-transparent rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                        value={selectedGroupId}
                        onChange={e => setSelectedGroupId(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 text-base text-gray-900 bg-gray-100 border border-transparent rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">{t('all')} {t('classes')}</option>
                        {school.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('student')}</th>
                            <th scope="col" className="px-6 py-3">{t('class')}</th>
                            <th scope="col" className="px-6 py-3">{t('session')}</th>
                            <th scope="col" className="px-6 py-3">{t('time')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceRecords.length > 0 ? (
                            attendanceRecords.map(record => (
                                <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{record.studentName}</td>
                                    <td className="px-6 py-4">{record.groupName}</td>
                                    <td className="px-6 py-4">{record.sessionName}</td>
                                    <td className="px-6 py-4">{record.sessionTime}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={getStatusBadge(record.status)}>{t(record.status as any)}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    {t('noAttendanceRecords')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendancePage;
