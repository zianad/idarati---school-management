import React, { createContext, useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { AppContextType, School, User, UserRole, Student, Teacher, StaffMember, Level, Group, Course, Expense, Payment, Subject, ScheduledSession, Attendance, CafeteriaPayment, CafeteriaUsage } from './types/index.ts';
import * as db from './lib/db.ts';

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
const getInitialSeedData = (): School[] => {
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
            students: [{ id: 's1', name: 'أحمد علي', parentPhone: '0555111222', levelId: 'l1', groupIds: ['g1'], subjectIds: ['sub1', 'sub2', 'sub3'], courseIds: ['c1'], registrationDate: new Date().toISOString(), schoolName: 'مدرسة ابتدائية', hasTransportation: true }],
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
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

    // Load schools from IndexedDB on initial mount
    useEffect(() => {
        const loadData = async () => {
            try {
                let schoolsFromDB = await db.getAllSchools();

                // If DB is empty, try to migrate from localStorage or seed initial data
                if (schoolsFromDB.length === 0) {
                    const savedSchools = localStorage.getItem('schools');
                    if (savedSchools) {
                        try {
                           const parsed = JSON.parse(savedSchools);
                           if (Array.isArray(parsed) && parsed.length > 0) {
                               await db.bulkPutSchools(parsed);
                               schoolsFromDB = parsed;
                               console.log("Migrated data from localStorage to IndexedDB.");
                               localStorage.removeItem('schools'); 
                           } else {
                               const initialData = getInitialSeedData();
                               await db.bulkPutSchools(initialData);
                               schoolsFromDB = initialData;
                           }
                        } catch(e) {
                             const initialData = getInitialSeedData();
                             await db.bulkPutSchools(initialData);
                             schoolsFromDB = initialData;
                        }
                    } else {
                        const initialData = getInitialSeedData();
                        await db.bulkPutSchools(initialData);
                        schoolsFromDB = initialData;
                    }
                }
                
                // Data migration for schema changes
                const migratedSchools = schoolsFromDB.map(school => ({ 
                    ...school, 
                    isActive: school.isActive !== undefined ? school.isActive : true,
                    scheduledSessions: school.scheduledSessions || [],
                    attendance: school.attendance || [],
                    staff: school.staff || [],
                    transportationFee: school.transportationFee || 0,
                    cafeteriaDailyFee: school.cafeteriaDailyFee ?? (school as any).cafeteriaFee ?? 0,
                    cafeteriaPayments: school.cafeteriaPayments || [],
                    cafeteriaUsage: school.cafeteriaUsage || [],
                    trialEndDate: school.trialEndDate 
                }));

                // Check for expired trials
                const today = new Date().toISOString().slice(0, 10);
                let schoolsUpdated = false;
                const finalSchools = migratedSchools.map(school => {
                    if (school.isActive && school.trialEndDate && school.trialEndDate < today) {
                        schoolsUpdated = true;
                        return { ...school, isActive: false };
                    }
                    return school;
                });
            
                if (schoolsUpdated) {
                    await db.bulkPutSchools(finalSchools);
                }
                setSchools(finalSchools);

            } catch (error) {
                console.error("Failed to load schools from DB", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

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

    // Navigation logic on user change
    useEffect(() => {
        if (!isLoading) {
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, originalUser, isLoading]);

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
    
    const findSchool = useCallback((schoolId: string) => schools.find(s => s.id === schoolId), [schools]);
    
    const modifySchool = async (schoolId: string, modification: (school: School) => School) => {
        const schoolToModify = schools.find(s => s.id === schoolId);
        if (!schoolToModify) return;
        const modifiedSchool = modification(schoolToModify);
        await db.putSchool(modifiedSchool);
        setSchools(prev => prev.map(s => s.id === schoolId ? modifiedSchool : s));
    };

    const addSchool = async (schoolDetails: { name: string; logo: string; ownerCode: string; staffCode: string; trialDays: number; }) => {
        let trialEndDate: string | undefined = undefined;
        if (schoolDetails.trialDays > 0) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + schoolDetails.trialDays);
            trialEndDate = endDate.toISOString().slice(0, 10);
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
        await db.putSchool(newSchool);
        setSchools(prev => [...prev, newSchool]);
    };

    const deleteSchool = async (schoolId: string) => {
        await db.deleteSchoolDB(schoolId);
        setSchools(prev => prev.filter(s => s.id !== schoolId));
    };
    
    const toggleSchoolStatus = async (schoolId: string) => {
        await modifySchool(schoolId, school => ({ ...school, isActive: !school.isActive }));
    };

    const activateSchoolPermanently = async (schoolId: string) => {
        await modifySchool(schoolId, school => ({
            ...school,
            trialEndDate: undefined,
            isActive: true
        }));
    };

    const updateSchoolDetails = async (schoolId: string, details: { name: string; logo: string; }) => {
        await modifySchool(schoolId, school => ({ ...school, ...details }));
    }

    const updateSchoolFees = async (schoolId: string, fees: { transportationFee: number; cafeteriaDailyFee: number; }) => {
        await modifySchool(schoolId, school => ({ ...school, ...fees }));
    }
    
    const updateSchoolCodes = async (schoolId: string, codes: { ownerCode: string; staffCode: string; }) => {
        await modifySchool(schoolId, school => ({ ...school, ...codes }));
    }

    const addStudent = async (schoolId: string, studentData: Omit<Student, 'id' | 'registrationDate' | 'subjectIds'>) => {
        await modifySchool(schoolId, school => {
            const subjectsForLevel = school.subjects.filter(s => s.levelId === studentData.levelId).map(s => s.id);
            const newStudent: Student = { 
                ...studentData, 
                subjectIds: subjectsForLevel,
                id: generateId(), 
                registrationDate: new Date().toISOString()
            };
            return { ...school, students: [...school.students, newStudent] };
        });
    };
    
    const addStudentsBulk = async (schoolId: string, students: Omit<Student, 'id' | 'registrationDate' | 'subjectIds'>[]) => {
        await modifySchool(schoolId, school => {
            const newStudentsWithIds = students.map(s => {
                const subjectsForLevel = school.subjects.filter(sub => sub.levelId === s.levelId).map(sub => sub.id);
                return {
                    ...s,
                    id: generateId(),
                    registrationDate: new Date().toISOString(),
                    subjectIds: subjectsForLevel,
                } as Student;
            });
            return { ...school, students: [...school.students, ...newStudentsWithIds] };
        });
    };

    const updateStudent = async (schoolId: string, student: Student) => {
        await modifySchool(schoolId, s => {
            const originalStudent = s.students.find(st => st.id === student.id);
            let updatedStudent = { ...student };

            if (originalStudent && originalStudent.levelId !== student.levelId) {
                const subjectsForNewLevel = s.subjects.filter(sub => sub.levelId === student.levelId).map(sub => sub.id);
                updatedStudent.subjectIds = subjectsForNewLevel;
            }

            return { ...s, students: s.students.map(st => st.id === student.id ? updatedStudent : st) };
        });
    };

    const deleteStudent = async (schoolId: string, studentId: string) => {
        await modifySchool(schoolId, s => ({ ...s, students: s.students.filter(st => st.id !== studentId) }));
    };

    const addTeacher = async (schoolId: string, teacher: Omit<Teacher, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, teachers: [...s.teachers, { ...teacher, id: generateId() }] }));
    };

    const updateTeacher = async (schoolId: string, teacher: Teacher) => {
        await modifySchool(schoolId, s => ({ ...s, teachers: s.teachers.map(t => t.id === teacher.id ? teacher : t) }));
    };

    const deleteTeacher = async (schoolId: string, teacherId: string) => {
        await modifySchool(schoolId, s => ({ ...s, teachers: s.teachers.filter(t => t.id !== teacherId) }));
    };

    const addStaffMember = async (schoolId: string, staffMember: Omit<StaffMember, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, staff: [...s.staff, { ...staffMember, id: generateId() }] }));
    };

    const updateStaffMember = async (schoolId: string, staffMember: StaffMember) => {
        await modifySchool(schoolId, s => ({ ...s, staff: s.staff.map(sm => sm.id === staffMember.id ? staffMember : sm) }));
    };

    const deleteStaffMember = async (schoolId: string, staffMemberId: string) => {
        await modifySchool(schoolId, s => ({ ...s, staff: s.staff.filter(sm => sm.id !== staffMemberId) }));
    };

    const addLevel = async (schoolId: string, level: Omit<Level, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, levels: [...s.levels, { ...level, id: generateId() }] }));
    };
    
    const deleteLevel = async (schoolId: string, levelId: string) => {
        await modifySchool(schoolId, s => ({ ...s, levels: s.levels.filter(l => l.id !== levelId) }));
    };

    const addGroup = async (schoolId: string, group: Omit<Group, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, groups: [...s.groups, { ...group, id: generateId() }] }));
    };
    
    const deleteGroup = async (schoolId: string, groupId: string) => {
        await modifySchool(schoolId, s => ({ ...s, groups: s.groups.filter(g => g.id !== groupId) }));
    };
    
    const addCourse = async (schoolId: string, course: Omit<Course, 'id'>, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => {
        const newCourse = { ...course, id: generateId() };
        await modifySchool(schoolId, school => {
            const newSessions = [...school.scheduledSessions];
            if (sessionData) {
                sessionData.forEach(session => {
                    newSessions.push({ ...session, id: generateId(), courseId: newCourse.id });
                });
            }
            return { ...school, courses: [...school.courses, newCourse], scheduledSessions: newSessions };
        });
    };
    
    const updateCourse = async (schoolId: string, course: Course) => {
        await modifySchool(schoolId, s => ({ ...s, courses: s.courses.map(c => c.id === course.id ? course : c) }));
    };

    const deleteCourse = async (schoolId: string, courseId: string) => {
        await modifySchool(schoolId, s => ({ ...s, courses: s.courses.filter(c => c.id !== courseId) }));
    };
    
    const addSubject = async (schoolId: string, subject: Omit<Subject, 'id'>, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => {
        const newSubject = { ...subject, id: generateId() };
        await modifySchool(schoolId, school => {
            const newSessions = [...school.scheduledSessions];
            if (sessionData) {
                sessionData.forEach(session => {
                    newSessions.push({ ...session, id: generateId(), subjectId: newSubject.id });
                });
            }
            return { ...school, subjects: [...school.subjects, newSubject], scheduledSessions: newSessions };
        });
    };

    const updateSubject = async (schoolId: string, subject: Subject) => {
        await modifySchool(schoolId, s => ({ ...s, subjects: s.subjects.map(sub => sub.id === subject.id ? subject : sub) }));
    };

    const deleteSubject = async (schoolId: string, subjectId: string) => {
        await modifySchool(schoolId, s => ({ ...s, subjects: s.subjects.filter(sub => sub.id !== subjectId) }));
    };

    const addExpense = async (schoolId: string, expense: Omit<Expense, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, expenses: [...s.expenses, { ...expense, id: generateId() }] }));
    };
    
    const addPayment = async (schoolId: string, payment: Omit<Payment, 'id'>) => {
        await modifySchool(schoolId, s => ({ ...s, payments: [...s.payments, { ...payment, id: generateId() }] }));
    };

    const addCafeteriaPayment = async (schoolId: string, paymentData: Omit<CafeteriaPayment, 'id' | 'paymentDate' | 'amount'>) => {
        await modifySchool(schoolId, school => {
            const amount = paymentData.dates.length * school.cafeteriaDailyFee;
            const newPayment: CafeteriaPayment = { ...paymentData, amount, id: generateId(), paymentDate: new Date().toISOString() };
            return { ...school, cafeteriaPayments: [...school.cafeteriaPayments, newPayment] };
        });
    };

    const updateSchedule = async (schoolId: string, sessions: ScheduledSession[]) => {
        await modifySchool(schoolId, s => ({ ...s, scheduledSessions: sessions }));
    };
    
    const recordAttendance = async (schoolId: string, records: Omit<Attendance, 'id'>[]) => {
        await modifySchool(schoolId, school => {
            const newAttendance = [...school.attendance];
            records.forEach(record => {
                const existingIndex = newAttendance.findIndex(att => att.studentId === record.studentId && att.sessionId === record.sessionId && att.date === record.date);
                if (existingIndex > -1) {
                    newAttendance[existingIndex] = { ...newAttendance[existingIndex], status: record.status };
                } else {
                    newAttendance.push({ ...record, id: generateId() });
                }
            });
            return { ...school, attendance: newAttendance };
        });
    };
    
    const recordCafeteriaUsage = async (schoolId: string, studentIds: string[], date: string) => {
        await modifySchool(schoolId, school => {
            const otherDaysUsage = school.cafeteriaUsage.filter(usage => usage.date !== date);
            const newUsageForDate: CafeteriaUsage[] = studentIds.map(studentId => ({ studentId, date }));
            return { ...school, cafeteriaUsage: [...otherDaysUsage, ...newUsageForDate] };
        });
    };

    const restoreData = async (data: { schools: School[] }) => {
        await db.clearSchools();
        await db.bulkPutSchools(data.schools);
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
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="text-xl font-semibold">Loading...</div></div>;
    }

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