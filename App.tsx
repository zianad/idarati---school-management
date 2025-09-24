

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { AppContextType, School, User, UserRole, Student, Teacher, StaffMember, Level, Group, Course, Expense, Payment, Subject, ScheduledSession, Attendance, CafeteriaPayment, CafeteriaUsage } from './types/index.ts';

import LoginPage from './pages/LoginPage.tsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.tsx';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/school/Dashboard.tsx';
import Students from './pages/school/Students.tsx';
import Teachers from './pages/school/Teachers.tsx';
import Staff from './pages/school/Staff.tsx';
import LevelsAndGroups from './pages/school/LevelsAndGroups.tsx';
import SubjectsPage from './pages/school/Courses.tsx';
import Schedule from './pages/school/Schedule.tsx';
import Finances from './pages/school/Finances.tsx';
import Settings from './pages/Settings.tsx';
import AttendancePage from './pages/school/Attendance.tsx';
import CafeteriaPage from './pages/Products.tsx';
import { useAppContext } from './hooks/useAppContext.ts';
import { TranslationKey } from './i18n/index.ts';

// --- Helper Functions ---
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Initial Data ---
const getInitialSchools = (): School[] => {
    const savedSchools = localStorage.getItem('schools');
    if (savedSchools) {
        try {
            const parsed = JSON.parse(savedSchools);
            if (Array.isArray(parsed)) {
                // Ensure all schools have necessary properties
                return parsed.map(school => ({ 
                    ...school, 
                    isActive: school.isActive !== undefined ? school.isActive : true,
                    scheduledSessions: school.scheduledSessions || [],
                    attendance: school.attendance || [],
                    staff: school.staff || [],
                    transportationFee: school.transportationFee || 0,
                    cafeteriaDailyFee: school.cafeteriaDailyFee ?? school.cafeteriaFee ?? 0, // Migration from old fee
                    cafeteriaPayments: school.cafeteriaPayments || [],
                    cafeteriaUsage: school.cafeteriaUsage || [],
                    trialEndDate: school.trialEndDate 
                }));
            }
        } catch (e) {
            console.error("Failed to parse schools from localStorage", e);
        }
    }
    // Seed with initial data if nothing is in localStorage or parsing fails
    return [
        {
            id: 'school_1',
            name: 'مدرسة النجاح',
            logo: 'https://picsum.photos/seed/school1/200',
            ownerCode: 'owner123',
            staffCode: 'staff123',
            isActive: true,
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
            levels: [{ id: 'l1', name: 'المستوى الأول' }],
            groups: [{ id: 'g1', name: 'القسم أ', levelId: 'l1' }],
            subjects: [
                {id: 'sub1', name: 'الرياضيات', fee: 250, classroom: '101', levelId: 'l1', color: '#bfdbfe'}, 
                {id: 'sub2', name: 'العربية', fee: 200, classroom: '102', levelId: 'l1', color: '#bbf7d0'},
                {id: 'sub3', name: 'الفرنسية', fee: 220, classroom: '101', levelId: 'l1', color: '#fecaca'}
            ],
            students: [{ id: 's1', name: 'أحمد علي', parentPhone: '0555111222', levelId: 'l1', groupIds: ['g1'], subjectIds: ['sub1', 'sub2'], courseIds: ['c1'], registrationDate: new Date().toISOString(), schoolName: 'مدرسة ابتدائية', hasTransportation: true }],
            teachers: [{ id: 't1', name: 'الأستاذ خالد', subjects: ['sub1', 'sub3'], levelIds: ['l1'], courseIds: ['c1'], phone: '0555333444', salary: { type: 'fixed', value: 5000 } }, { id: 't2', name: 'الأستاذة فاطمة', subjects: ['sub2'], levelIds: ['l1'], phone: '0555555555', salary: { type: 'percentage', value: 50 } }],
            staff: [{id: 'staff1', name: 'سائق الحافلة', role: 'driver', salary: 3000}],
            courses: [{ id: 'c1', name: 'نادي البرمجة', fee: 200, teacherIds: ['t1'], color: '#f5d0fe' }],
            payments: [{ id: 'p1', studentId: 's1', amount: 450, date: '2024-05', description: 'قسط شهر مايو' }],
            expenses: [{ id: 'e1', description: 'فواتير كهرباء', amount: 500, date: '2024-05-15', category: 'other' }],
            scheduledSessions: [],
            attendance: [],
            transportationFee: 250,
            cafeteriaDailyFee: 25,
            cafeteriaPayments: [],
            cafeteriaUsage: [],
        }
    ];
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const PrivateSchoolLayout = () => {
    const { currentUser } = useAppContext();

    if (!currentUser || currentUser.role === UserRole.SuperAdmin) {
        return <Navigate to="/login" replace />;
    }
    
    return <Layout />;
};


const AppLogic: React.FC = () => {
    const [schools, setSchools] = useState<School[]>(getInitialSchools);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [originalUser, setOriginalUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('originalUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const navigate = useNavigate();
    const location = useLocation();

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('schools', JSON.stringify(schools));
    }, [schools]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    useEffect(() => {
        if (originalUser) {
            localStorage.setItem('originalUser', JSON.stringify(originalUser));
        } else {
            localStorage.removeItem('originalUser');
        }
    }, [originalUser]);
    
    // Check for expired trials on initial load
    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        let schoolsUpdated = false;
    
        const updatedSchools = schools.map(school => {
            if (school.isActive && school.trialEndDate && school.trialEndDate < today) {
                schoolsUpdated = true;
                return { ...school, isActive: false };
            }
            return school;
        });
    
        if (schoolsUpdated) {
            setSchools(updatedSchools);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Navigation logic on user change
    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === UserRole.SuperAdmin && !originalUser) {
                navigate('/super-admin');
            } else if (currentUser.role === UserRole.SchoolOwner || currentUser.role === UserRole.Staff) {
                if (location.pathname === '/login' || location.pathname === '/super-admin') {
                   navigate('/');
                }
            }
        } else {
            navigate('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, originalUser]);

    const login = (code: string): { success: boolean; messageKey?: TranslationKey } => {
        if (code === 'Abzn11241984') {
            setCurrentUser({ name: 'Super Admin', role: UserRole.SuperAdmin });
            return { success: true };
        }
        for (const school of schools) {
            if (code === school.ownerCode || code === school.staffCode) {
                 if (!school.isActive) {
                    return { success: false, messageKey: 'schoolIsInactive' };
                }
                if (code === school.ownerCode) {
                    setCurrentUser({ name: `${school.name} Owner`, role: UserRole.SchoolOwner, schoolId: school.id });
                } else {
                    setCurrentUser({ name: `Staff Member`, role: UserRole.Staff, schoolId: school.id });
                }
                return { success: true };
            }
        }
        return { success: false, messageKey: 'invalidCode' };
    };

    const logout = () => {
        setCurrentUser(null);
        setOriginalUser(null);
    };

    const impersonateSchoolOwner = (schoolId: string) => {
        const school = schools.find(s => s.id === schoolId);
        if (school && currentUser && currentUser.role === UserRole.SuperAdmin) {
            setOriginalUser(currentUser);
            setCurrentUser({
                name: `${school.name} Owner`,
                role: UserRole.SchoolOwner,
                schoolId: school.id
            });
        }
    };

    const stopImpersonating = () => {
        if (originalUser) {
            setCurrentUser(originalUser);
            setOriginalUser(null);
        }
    };

    const updateSchools = (updater: (prevSchools: School[]) => School[]) => {
        setSchools(updater);
    };

    const findSchool = useCallback((schoolId: string) => schools.find(s => s.id === schoolId), [schools]);

    // --- State modification functions ---
    
    const modifySchool = (schoolId: string, modification: (school: School) => School) => {
        updateSchools(prev => prev.map(s => s.id === schoolId ? modification(s) : s));
    };

    const addSchool = (schoolDetails: { name: string; logo: string; ownerCode: string; staffCode: string; trialDays: number; }) => {
        let trialEndDate: string | undefined = undefined;
        if (schoolDetails.trialDays > 0) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + schoolDetails.trialDays);
            trialEndDate = endDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }

        const newSchool: School = {
            id: generateId(),
            name: schoolDetails.name,
            logo: schoolDetails.logo,
            ownerCode: schoolDetails.ownerCode,
            staffCode: schoolDetails.staffCode,
            isActive: true,
            trialEndDate,
            students: [], teachers: [], staff: [], levels: [], groups: [], courses: [], subjects: [], payments: [], expenses: [], scheduledSessions: [], attendance: [],
            transportationFee: 0,
            cafeteriaDailyFee: 0,
            cafeteriaPayments: [],
            cafeteriaUsage: []
        };
        updateSchools(prev => [...prev, newSchool]);
    };

    const deleteSchool = (schoolId: string) => {
        updateSchools(prev => prev.filter(s => s.id !== schoolId));
    };
    
    const toggleSchoolStatus = (schoolId: string) => {
        modifySchool(schoolId, school => ({ ...school, isActive: !school.isActive }));
    };

    const activateSchoolPermanently = (schoolId: string) => {
        modifySchool(schoolId, school => ({
            ...school,
            trialEndDate: undefined,
            isActive: true
        }));
    };

    const updateSchoolDetails = (schoolId: string, details: { name: string; logo: string; }) => {
        modifySchool(schoolId, school => ({ ...school, ...details }));
    }

    const updateSchoolFees = (schoolId: string, fees: { transportationFee: number; cafeteriaDailyFee: number; }) => {
        modifySchool(schoolId, school => ({ ...school, ...fees }));
    }
    
    const updateSchoolCodes = (schoolId: string, codes: { ownerCode: string; staffCode: string; }) => {
        modifySchool(schoolId, school => ({ ...school, ...codes }));
    }

    const addStudent = (schoolId: string, studentData: Omit<Student, 'id' | 'registrationDate'>) => {
        const newStudent: Student = { ...studentData, id: generateId(), registrationDate: new Date().toISOString() };
        modifySchool(schoolId, school => ({ ...school, students: [...school.students, newStudent] }));
    };
    
    const addStudentsBulk = (schoolId: string, students: Omit<Student, 'id' | 'registrationDate'>[]) => {
        modifySchool(schoolId, school => {
            const newStudentsWithIds = students.map(s => ({
                ...s,
                id: generateId(),
                registrationDate: new Date().toISOString()
            }));
            
            return {
                ...school,
                students: [...school.students, ...newStudentsWithIds]
            };
        });
    };


    const updateStudent = (schoolId: string, student: Student) => {
        modifySchool(schoolId, s => ({ ...s, students: s.students.map(st => st.id === student.id ? student : st) }));
    };

    const deleteStudent = (schoolId: string, studentId: string) => {
        modifySchool(schoolId, s => ({ ...s, students: s.students.filter(st => st.id !== studentId) }));
    };

    const addTeacher = (schoolId: string, teacher: Omit<Teacher, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, teachers: [...s.teachers, { ...teacher, id: generateId() }] }));
    };

    const updateTeacher = (schoolId: string, teacher: Teacher) => {
        modifySchool(schoolId, s => ({ ...s, teachers: s.teachers.map(t => t.id === teacher.id ? teacher : t) }));
    };

    const deleteTeacher = (schoolId: string, teacherId: string) => {
        modifySchool(schoolId, s => ({ ...s, teachers: s.teachers.filter(t => t.id !== teacherId) }));
    };

    const addStaffMember = (schoolId: string, staffMember: Omit<StaffMember, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, staff: [...s.staff, { ...staffMember, id: generateId() }] }));
    };

    const updateStaffMember = (schoolId: string, staffMember: StaffMember) => {
        modifySchool(schoolId, s => ({ ...s, staff: s.staff.map(sm => sm.id === staffMember.id ? staffMember : sm) }));
    };

    const deleteStaffMember = (schoolId: string, staffMemberId: string) => {
        modifySchool(schoolId, s => ({ ...s, staff: s.staff.filter(sm => sm.id !== staffMemberId) }));
    };


    const addLevel = (schoolId: string, level: Omit<Level, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, levels: [...s.levels, { ...level, id: generateId() }] }));
    };
    
    const deleteLevel = (schoolId: string, levelId: string) => {
        modifySchool(schoolId, s => ({ ...s, levels: s.levels.filter(l => l.id !== levelId) }));
    };

    const addGroup = (schoolId: string, group: Omit<Group, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, groups: [...s.groups, { ...group, id: generateId() }] }));
    };
    
    const deleteGroup = (schoolId: string, groupId: string) => {
        modifySchool(schoolId, s => ({ ...s, groups: s.groups.filter(g => g.id !== groupId) }));
    };
    
    const addCourse = (schoolId: string, course: Omit<Course, 'id'>, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => {
        const newCourse = { ...course, id: generateId() };
        modifySchool(schoolId, school => {
            const newSessions = [...school.scheduledSessions];
            if (sessionData) {
                sessionData.forEach(session => {
                    newSessions.push({
                        ...session,
                        id: generateId(),
                        courseId: newCourse.id,
                    });
                });
            }
            return { ...school, courses: [...school.courses, newCourse], scheduledSessions: newSessions };
        });
    };
    
    const updateCourse = (schoolId: string, course: Course) => {
        modifySchool(schoolId, s => ({ ...s, courses: s.courses.map(c => c.id === course.id ? course : c) }));
    };

    const deleteCourse = (schoolId: string, courseId: string) => {
        modifySchool(schoolId, s => ({ ...s, courses: s.courses.filter(c => c.id !== courseId) }));
    };
    
    const addSubject = (schoolId: string, subject: Omit<Subject, 'id'>, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => {
        const newSubject = { ...subject, id: generateId() };
        modifySchool(schoolId, school => {
            const newSessions = [...school.scheduledSessions];
            if (sessionData) {
                sessionData.forEach(session => {
                    newSessions.push({
                        ...session,
                        id: generateId(),
                        subjectId: newSubject.id,
                    });
                });
            }
            return { ...school, subjects: [...school.subjects, newSubject], scheduledSessions: newSessions };
        });
    };

    const updateSubject = (schoolId: string, subject: Subject) => {
        modifySchool(schoolId, s => ({ ...s, subjects: s.subjects.map(sub => sub.id === subject.id ? subject : sub) }));
    };

    const deleteSubject = (schoolId: string, subjectId: string) => {
        modifySchool(schoolId, s => ({ ...s, subjects: s.subjects.filter(sub => sub.id !== subjectId) }));
    };

    const addExpense = (schoolId: string, expense: Omit<Expense, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, expenses: [...s.expenses, { ...expense, id: generateId() }] }));
    };
    
    const addPayment = (schoolId: string, payment: Omit<Payment, 'id'>) => {
        modifySchool(schoolId, s => ({ ...s, payments: [...s.payments, { ...payment, id: generateId() }] }));
    };

    const addCafeteriaPayment = (schoolId: string, paymentData: Omit<CafeteriaPayment, 'id' | 'paymentDate' | 'amount'>) => {
        modifySchool(schoolId, school => {
            const amount = paymentData.dates.length * school.cafeteriaDailyFee;
            const newPayment: CafeteriaPayment = { ...paymentData, amount, id: generateId(), paymentDate: new Date().toISOString() };
            return { ...school, cafeteriaPayments: [...school.cafeteriaPayments, newPayment] };
        });
    };

    const updateSchedule = (schoolId: string, sessions: ScheduledSession[]) => {
        modifySchool(schoolId, s => ({ ...s, scheduledSessions: sessions }));
    };
    
    const recordAttendance = (schoolId: string, records: Omit<Attendance, 'id'>[]) => {
        modifySchool(schoolId, school => {
            const newAttendance = [...school.attendance];
            records.forEach(record => {
                const existingIndex = newAttendance.findIndex(
                    att => att.studentId === record.studentId && att.sessionId === record.sessionId && att.date === record.date
                );
                if (existingIndex > -1) {
                    newAttendance[existingIndex] = { ...newAttendance[existingIndex], status: record.status };
                } else {
                    newAttendance.push({ ...record, id: generateId() });
                }
            });
            return { ...school, attendance: newAttendance };
        });
    };
    
    const recordCafeteriaUsage = (schoolId: string, studentIds: string[], date: string) => {
        modifySchool(schoolId, school => {
            const otherDaysUsage = school.cafeteriaUsage.filter(usage => usage.date !== date);
            const newUsageForDate: CafeteriaUsage[] = studentIds.map(studentId => ({
                studentId,
                date,
            }));
            return { ...school, cafeteriaUsage: [...otherDaysUsage, ...newUsageForDate] };
        });
    };

    const restoreData = (data: { schools: School[] }) => {
        setSchools(data.schools);
    };


    const contextValue: AppContextType = {
        schools, currentUser, originalUser, login, logout, addSchool, deleteSchool,
        toggleSchoolStatus, activateSchoolPermanently, updateSchoolDetails, updateSchoolCodes, updateSchoolFees,
        impersonateSchoolOwner, stopImpersonating, findSchool,
        addStudent, addStudentsBulk, updateStudent, deleteStudent,
        addTeacher, updateTeacher, deleteTeacher,
        addStaffMember, updateStaffMember, deleteStaffMember,
        addLevel, deleteLevel, addGroup, deleteGroup,
        addCourse, updateCourse, deleteCourse,
        addSubject, updateSubject, deleteSubject,
        addExpense, addPayment, addCafeteriaPayment, updateSchedule,
        recordAttendance, recordCafeteriaUsage, restoreData,
    };

    return (
        <AppContext.Provider value={contextValue}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/super-admin" element={currentUser?.role === UserRole.SuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/" element={<PrivateSchoolLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="students" element={<Students />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="classes" element={<LevelsAndGroups />} />
                    <Route path="subjects" element={<SubjectsPage />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="cafeteria" element={<CafeteriaPage />} />
                    <Route path="finances" element={<Finances />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </AppContext.Provider>
    );
};

function App() {
  return (
    <HashRouter>
        <ThemeProvider>
            <LanguageProvider>
                <ToastProvider>
                    <AppLogic />
                </ToastProvider>
            </LanguageProvider>
        </ThemeProvider>
    </HashRouter>
  );
}

export default App;