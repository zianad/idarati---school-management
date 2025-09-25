
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext.ts';
import { useLanguage } from '../../hooks/useLanguage.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserRole, Student } from '../../types/index.ts';
import Modal from '../../components/Modal.tsx';
import { PlusCircle, Edit, Trash2, DollarSign, Upload, Utensils, Bus, ChevronLeft, ChevronRight } from 'lucide-react';
import ImportStudentsModal from '../../components/ImportStudentsModal.tsx';

const Students: React.FC = () => {
    const { currentUser, findSchool, addStudent, updateStudent, deleteStudent, addPayment, addCafeteriaPayment } = useAppContext();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const school = useMemo(() => currentUser?.schoolId ? findSchool(currentUser.schoolId) : undefined, [currentUser, findSchool]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({ name: '', schoolName: '', parentPhone: '', levelId: '', groupIds: [] as string[], subjectIds: [] as string[], hasTransportation: false });
    const [searchTerm, setSearchTerm] = useState('');

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
    const [paymentData, setPaymentData] = useState({ amount: 0, date: '', courseId: '' });

    // New state for cafeteria modal
    const [isCafeteriaModalOpen, setIsCafeteriaModalOpen] = useState(false);
    const [selectedStudentForCafeteria, setSelectedStudentForCafeteria] = useState<Student | null>(null);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const filteredStudents = useMemo(() => {
        if (!school) return [];
        return school.students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [school, searchTerm]);

    const handleOpenModal = (student: Student | null = null) => {
        setEditingStudent(student);
        if (student) {
            setFormData({ name: student.name, schoolName: student.schoolName || '', parentPhone: student.parentPhone, levelId: student.levelId, groupIds: student.groupIds, subjectIds: student.subjectIds || [], hasTransportation: !!student.hasTransportation });
        } else {
            setFormData({ name: '', schoolName: '', parentPhone: '', levelId: school?.levels[0]?.id || '', groupIds: [], subjectIds: [], hasTransportation: false });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.schoolId) return;

        const { name, parentPhone, levelId, groupIds, subjectIds, schoolName, hasTransportation } = formData;
        
        const studentData = {
            name,
            parentPhone,
            levelId,
            groupIds,
            subjectIds,
            hasTransportation,
            ...(schoolName && { schoolName })
        };


        if (editingStudent) {
            await updateStudent(currentUser.schoolId, { ...editingStudent, ...studentData });
            showToast(t('editSuccess'), 'success');
        } else {
            await addStudent(currentUser.schoolId, studentData);
            showToast(t('addSuccess'), 'success');
        }
        handleCloseModal();
    };
    
    const handleDelete = async (studentId: string) => {
        if(window.confirm(t('confirmDelete')) && currentUser?.schoolId) {
            await deleteStudent(currentUser.schoolId, studentId);
            showToast(t('deleteSuccess'), 'info');
        }
    }
    
    const handleGroupChange = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            groupIds: prev.groupIds.includes(groupId)
                ? prev.groupIds.filter(id => id !== groupId)
                : [...prev.groupIds, groupId]
        }));
    };

    const handleSubjectChange = (subjectId: string) => {
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...prev.subjectIds, subjectId]
        }));
    };

    const handleOpenPaymentModal = (student: Student) => {
        setSelectedStudentForPayment(student);
        setPaymentData({ amount: 0, date: new Date().toISOString().slice(0, 7), courseId: '' });
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedStudentForPayment(null);
    };

    const handlePaymentCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!school) return;
        const courseId = e.target.value;
        const course = school.courses.find(c => c.id === courseId);
        
        setPaymentData(prev => ({
            ...prev,
            courseId: courseId,
            amount: course ? course.fee : prev.amount, // Only update amount if a course is selected
        }));
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.schoolId || !selectedStudentForPayment) return;
        
        await addPayment(currentUser.schoolId, {
            studentId: selectedStudentForPayment.id,
            amount: paymentData.amount,
            date: paymentData.date,
            ...(paymentData.courseId && { courseId: paymentData.courseId })
        });
        
        showToast(t('addSuccess'), 'success');
        handleClosePaymentModal();
    };

    const handleOpenCafeteriaModal = (student: Student) => {
        setSelectedStudentForCafeteria(student);
        setSelectedDates(new Set());
        setCalendarMonth(new Date());
        setIsCafeteriaModalOpen(true);
    };

    const handleCloseCafeteriaModal = () => {
        setIsCafeteriaModalOpen(false);
        setSelectedStudentForCafeteria(null);
    };

    const handleCafeteriaSubmit = async () => {
        if (!currentUser?.schoolId || !selectedStudentForCafeteria || selectedDates.size === 0) return;
        await addCafeteriaPayment(currentUser.schoolId, {
            studentId: selectedStudentForCafeteria.id,
            dates: Array.from(selectedDates),
        });
        showToast(t('addSuccess'), 'success');
        handleCloseCafeteriaModal();
    };


    if (!school) return <div>Loading...</div>;
    
    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isOwner = currentUser?.role === UserRole.SchoolOwner;
    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border dark:border-gray-600";
    const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('studentList')}</h2>
                    <p className="text-blue-500 font-semibold">{filteredStudents.length} {t('students')}</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <input
                        type="text"
                        placeholder={t('searchStudentByName')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 text-base text-gray-900 bg-gray-100 border border-transparent rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isOwner && (
                        <>
                            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-2 rtl:space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0">
                                <Upload size={20} />
                                <span>{t('importFromExcel')}</span>
                            </button>
                            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                                <PlusCircle size={20} />
                                <span>{t('addNewStudent')}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('name')}</th>
                            <th scope="col" className="px-6 py-3">{t('level')}</th>
                            <th scope="col" className="px-6 py-3">{t('enrolledSubjects')}</th>
                            {isOwner && <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => {
                            const level = school.levels.find(l => l.id === student.levelId);
                            const subjects = school.subjects.filter(s => student.subjectIds?.includes(s.id));
                            return (
                                <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                                                {getInitials(student.name)}
                                            </div>
                                            <div>
                                                {student.name}
                                                <div className="flex items-center gap-2 mt-1">
                                                    {student.hasTransportation && <span title={t('transportation')}><Bus size={16} className="text-orange-500" /></span>}
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">{level?.name}</td>
                                    <td className="px-6 py-4">{subjects.map(g => g.name).join(', ')}</td>
                                    {isOwner && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                                                <button onClick={() => handleOpenCafeteriaModal(student)} title={t('cafeteriaPayment')} className="text-green-500 hover:text-green-700 p-1"><Utensils size={20} /></button>
                                                <button onClick={() => handleOpenPaymentModal(student)} title={t('addPayment')} className="text-yellow-500 hover:text-yellow-700 p-1"><DollarSign size={20} /></button>
                                                <button onClick={() => handleOpenModal(student)} title={t('edit')} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={20} /></button>
                                                <button onClick={() => handleDelete(student.id)} title={t('delete')} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={20} /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? t('editStudent') : t('addNewStudent')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>{t('name')}</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
                    </div>
                     <div>
                        <label className={labelClass}>{t('optionalSchoolName')}</label>
                        <input type="text" value={formData.schoolName} onChange={e => setFormData({ ...formData, schoolName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('parentPhone')}</label>
                        <input type="tel" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('level')}</label>
                        <select value={formData.levelId} onChange={e => setFormData({ ...formData, levelId: e.target.value, groupIds: [] })} required className={inputClass}>
                             <option value="" disabled>-- {t('level')} --</option>
                            {school.levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                        </select>
                    </div>
                    {formData.levelId && (
                        <div>
                            <label className={labelClass}>{t('classes')}</label>
                            <div className="mt-2 grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                {school.groups.filter(g => g.levelId === formData.levelId).map(group => (
                                    <label key={group.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.groupIds.includes(group.id)}
                                            onChange={() => handleGroupChange(group.id)}
                                            className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{group.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                     <div>
                        <label className={labelClass}>{t('subjects')}</label>
                        <div className="mt-2 grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-lg max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                            {school.subjects.map(subject => (
                                <label key={subject.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={formData.subjectIds.includes(subject.id)}
                                        onChange={() => handleSubjectChange(subject.id)}
                                        className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                    />
                                     <span className="text-gray-800 dark:text-gray-200">{subject.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('services')}</label>
                        <div className="mt-2 space-y-2 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                <input type="checkbox" checked={formData.hasTransportation} onChange={e => setFormData({ ...formData, hasTransportation: e.target.checked })} className="form-checkbox h-5 w-5 rounded text-blue-600" />
                                <span className="text-gray-800 dark:text-gray-200">{t('transportation')}</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{t('save')}</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isCafeteriaModalOpen} onClose={handleCloseCafeteriaModal} title={`${t('cafeteriaPayment')}: ${selectedStudentForCafeteria?.name}`}>
                <CafeteriaCalendar
                    school={school}
                    student={selectedStudentForCafeteria}
                    calendarMonth={calendarMonth}
                    setCalendarMonth={setCalendarMonth}
                    selectedDates={selectedDates}
                    setSelectedDates={setSelectedDates}
                    onConfirm={handleCafeteriaSubmit}
                />
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={handleClosePaymentModal} title={`${t('paymentFor')}: ${selectedStudentForPayment?.name}`}>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>{t('paymentAmount')}</label>
                        <input 
                            type="number" 
                            value={paymentData.amount} 
                            onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} 
                            required 
                            className={inputClass}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('paymentMonth')}</label>
                        <input 
                            type="month" 
                            value={paymentData.date} 
                            onChange={e => setPaymentData({ ...paymentData, date: e.target.value })} 
                            required 
                            className={inputClass} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('selectCourseOptional')}</label>
                        <select 
                            value={paymentData.courseId} 
                            onChange={handlePaymentCourseChange} 
                            className={inputClass}
                        >
                            <option value="">{t('tuitionFee')}</option>
                            {school.courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name} ({course.fee} MAD)</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                        <button type="button" onClick={handleClosePaymentModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{t('addPayment')}</button>
                    </div>
                </form>
            </Modal>
            
            {isOwner && school && (
                 <ImportStudentsModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    school={school}
                 />
            )}
        </div>
    );
};

const CafeteriaCalendar = ({ school, student, calendarMonth, setCalendarMonth, selectedDates, setSelectedDates, onConfirm }) => {
    const { t, language } = useLanguage();

    const paidDatesForStudent = useMemo(() => {
        if (!school || !student) return new Set();
        const dates = new Set<string>();
        school.cafeteriaPayments
            .filter(p => p.studentId === student.id)
            .forEach(p => p.dates.forEach(d => dates.add(d)));
        return dates;
    }, [school, student]);

    const handleDateClick = (dateStr: string) => {
        const newSelectedDates = new Set(selectedDates);
        if (newSelectedDates.has(dateStr)) {
            newSelectedDates.delete(dateStr);
        } else {
            newSelectedDates.add(dateStr);
        }
        setSelectedDates(newSelectedDates);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(calendarMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCalendarMonth(newDate);
    };

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );
    
    const todayStr = new Date().toISOString().split('T')[0];

    const totalAmount = selectedDates.size * (school.cafeteriaDailyFee || 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft /></button>
                <h3 className="font-bold text-lg">{calendarMonth.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`}></div>;
                    const date = new Date(year, month, day);
                    const dateStr = date.toISOString().split('T')[0];
                    const isPaid = paidDatesForStudent.has(dateStr);
                    const isSelected = selectedDates.has(dateStr);
                    const isPast = dateStr < todayStr;
                    const isDisabled = isPaid || isPast;

                    let buttonClass = "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ";
                    if (isDisabled) {
                        buttonClass += isPaid ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 cursor-not-allowed' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed';
                    } else if (isSelected) {
                        buttonClass += 'bg-blue-500 text-white font-bold ring-2 ring-blue-300';
                    } else {
                        buttonClass += 'hover:bg-blue-100 dark:hover:bg-blue-900/50';
                    }

                    return (
                        <button key={day} onClick={() => handleDateClick(dateStr)} disabled={isDisabled} className={buttonClass}>
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="pt-4 border-t dark:border-gray-600 space-y-3">
                <div className="flex justify-between items-center font-semibold">
                    <span>{t('daysSelected', { count: selectedDates.size })}</span>
                    <span>{t('daily')}: {school.cafeteriaDailyFee || 0} MAD</span>
                </div>
                 <div className="flex justify-between items-center text-lg font-bold text-blue-600 dark:text-blue-400">
                    <span>{t('totalAmount')}:</span>
                    <span>{totalAmount.toLocaleString()} MAD</span>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={onConfirm} disabled={selectedDates.size === 0} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {t('pay')}
                </button>
            </div>
        </div>
    );
};

export default Students;
