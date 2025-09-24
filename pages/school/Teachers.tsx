
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserRole, Teacher, Subject } from '../../types/index.ts';
import Modal from '../../components/Modal.tsx';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const Teachers: React.FC = () => {
    const { currentUser, findSchool, addTeacher, updateTeacher, deleteTeacher } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        subjects: [] as string[], 
        phone: '', 
        salary: { type: 'fixed' as 'fixed' | 'percentage' | 'per_session', value: 0 },
        levelIds: [] as string[],
        courseIds: [] as string[],
    });

    const teacherDues = useMemo(() => {
        if (!school) return [];
        return school.expenses
            .filter(expense => expense.teacherId)
            .map(expense => {
                const teacher = school.teachers.find(t => t.id === expense.teacherId);
                return {
                    ...expense,
                    teacherName: teacher ? teacher.name : 'N/A'
                }
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [school]);

    const handleOpenModal = (teacher: Teacher | null = null) => {
        setEditingTeacher(teacher);
        if (teacher) {
            setFormData({ name: teacher.name, subjects: teacher.subjects, phone: teacher.phone, salary: teacher.salary, levelIds: teacher.levelIds || [], courseIds: teacher.courseIds || [] });
        } else {
            setFormData({ name: '', subjects: [], phone: '', salary: { type: 'fixed', value: 0 }, levelIds: [], courseIds: [] });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeacher(null);
    };

    const handleSubjectChange = (subjectId: string) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(id => id !== subjectId)
                : [...prev.subjects, subjectId]
        }));
    };

    const handleLevelChange = (levelId: string) => {
        setFormData(prev => ({
            ...prev,
            levelIds: (prev.levelIds || []).includes(levelId)
                ? (prev.levelIds || []).filter(id => id !== levelId)
                : [...(prev.levelIds || []), levelId]
        }));
    };

    const handleCourseChange = (courseId: string) => {
        setFormData(prev => ({
            ...prev,
            courseIds: (prev.courseIds || []).includes(courseId)
                ? (prev.courseIds || []).filter(id => id !== courseId)
                : [...(prev.courseIds || []), courseId]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.schoolId) return;

        if (editingTeacher) {
            updateTeacher(currentUser.schoolId, { ...editingTeacher, ...formData });
             showToast(t('editSuccess'), 'success');
        } else {
            addTeacher(currentUser.schoolId, formData);
             showToast(t('addSuccess'), 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (teacherId: string) => {
        if(window.confirm(t('confirmDelete')) && currentUser?.schoolId) {
            deleteTeacher(currentUser.schoolId, teacherId);
            showToast(t('deleteSuccess'), 'info');
        }
    }

    if (!school) return <div>Loading...</div>;

    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isOwner = currentUser?.role === UserRole.SchoolOwner;
    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('teacherList')}</h2>
                    {isOwner && (
                        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <PlusCircle size={20} />
                            <span>{t('addNewTeacher')}</span>
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('name')}</th>
                                <th scope="col" className="px-6 py-3">{t('subjects')}</th>
                                <th scope="col" className="px-6 py-3">{t('levels')}</th>
                                <th scope="col" className="px-6 py-3">{t('extracurricularActivities')}</th>
                                {isOwner && <th scope="col" className="px-6 py-3">{t('salary')}</th>}
                                {isOwner && <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {school.teachers.map(teacher => {
                                const teacherSubjects = school.subjects
                                    .filter(s => teacher.subjects.includes(s.id))
                                    .map(s => s.name)
                                    .join(', ');

                                const teacherLevels = school.levels
                                    .filter(l => (teacher.levelIds || []).includes(l.id))
                                    .map(l => l.name)
                                    .join(', ');
                                
                                const teacherCourses = school.courses
                                    .filter(c => (teacher.courseIds || []).includes(c.id))
                                    .map(c => c.name)
                                    .join(', ');

                                const salaryTypeKey = teacher.salary.type === 'fixed' ? 'fixedSalary' : teacher.salary.type === 'percentage' ? 'percentage' : 'perSession';
                                const salaryDisplay = `${teacher.salary.value.toLocaleString()} ${teacher.salary.type === 'percentage' ? '%' : 'MAD'}`;

                                return (
                                    <tr key={teacher.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                         <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold">
                                                    {getInitials(teacher.name)}
                                                </div>
                                                <div>
                                                    {teacher.name}
                                                    <p className="font-normal text-gray-500 dark:text-gray-400">{teacher.phone}</p>
                                                </div>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4">{teacherSubjects}</td>
                                        <td className="px-6 py-4">{teacherLevels}</td>
                                        <td className="px-6 py-4">{teacherCourses}</td>
                                        {isOwner && <td className="px-6 py-4">{salaryDisplay} <span className="text-xs">({t(salaryTypeKey)})</span></td>}
                                        {isOwner && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                                                    <button onClick={() => handleOpenModal(teacher)} className="text-blue-500 hover:text-blue-700"><Edit size={20} /></button>
                                                    <button onClick={() => handleDelete(teacher.id)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTeacher ? t('editTeacher') : t('addNewTeacher')}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClass}>{t('name')}</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
                        </div>
                         <div>
                            <label className={labelClass}>{t('phone')}</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>{t('subjects')}</label>
                             <div className="mt-2 grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-lg max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                                {school.subjects.map(subject => (
                                    <label key={subject.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.subjects.includes(subject.id)}
                                            onChange={() => handleSubjectChange(subject.id)}
                                            className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('levels')}</label>
                             <div className="mt-2 grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-lg max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                                {school.levels.map(level => (
                                    <label key={level.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={(formData.levelIds || []).includes(level.id)}
                                            onChange={() => handleLevelChange(level.id)}
                                            className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{level.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('extracurricularActivities')}</label>
                             <div className="mt-2 grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-lg max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                                {school.courses.map(course => (
                                    <label key={course.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={(formData.courseIds || []).includes(course.id)}
                                            onChange={() => handleCourseChange(course.id)}
                                            className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{course.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('salaryType')}</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <select 
                                        value={formData.salary.type} 
                                        onChange={e => setFormData({ ...formData, salary: {...formData.salary, type: e.target.value as any} })} 
                                        required 
                                        className={inputClass}
                                    >
                                        <option value="fixed">{t('fixedSalary')}</option>
                                        <option value="percentage">{t('percentage')}</option>
                                        <option value="per_session">{t('perSession')}</option>
                                    </select>
                                </div>
                                <div>
                                    <input 
                                        type="number" 
                                        value={formData.salary.value} 
                                        onChange={e => setFormData({ ...formData, salary: {...formData.salary, value: Number(e.target.value)} })} 
                                        required 
                                        className={inputClass}
                                        placeholder={t('salaryValue')}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{t('save')}</button>
                        </div>
                    </form>
                </Modal>
            </div>

            {isOwner && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('teacherDues')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('name')}</th>
                                    <th scope="col" className="px-6 py-3">{t('description')}</th>
                                    <th scope="col" className="px-6 py-3">{t('amount')}</th>
                                    <th scope="col" className="px-6 py-3">{t('date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teacherDues.length > 0 ? (
                                    teacherDues.map(due => (
                                        <tr key={due.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{due.teacherName}</td>
                                            <td className="px-6 py-4">{due.description}</td>
                                            <td className="px-6 py-4 font-semibold text-red-500 dark:text-red-400">{due.amount.toLocaleString()} MAD</td>
                                            <td className="px-6 py-4">{due.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            {t('noTeacherDuesFound')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teachers;