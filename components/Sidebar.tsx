import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, BarChart2, LogOut, Briefcase, Utensils, Network, CalendarDays, UserCheck, Settings as SettingsIcon, BookCopy } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useAppContext } from '../hooks/useAppContext.ts';
import { UserRole } from '../types/index.ts';

const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg text-md transition-colors ${
      isActive
        ? 'bg-blue-500 text-white shadow-md'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;
    
  const iconClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg p-2 transition-colors ${
        isActive
        ? 'bg-white text-blue-500'
        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-white text-blue-500'
    }`;

  const navItems = [
    { to: '/', label: t('dashboard'), icon: <LayoutDashboard size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/students', label: t('students'), icon: <Users size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/teachers', label: t('teachers'), icon: <UserCog size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/staff', label: t('staff'), icon: <Briefcase size={20} />, role: [UserRole.SchoolOwner] },
    { to: '/classes', label: t('classes'), icon: <Network size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/subjects', label: t('subjects'), icon: <BookCopy size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/schedule', label: t('schedule'), icon: <CalendarDays size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/cafeteria', label: t('cafeteria'), icon: <Utensils size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/attendance', label: t('attendance'), icon: <UserCheck size={20} />, role: [UserRole.SchoolOwner, UserRole.Staff] },
    { to: '/finances', label: t('finances'), icon: <BarChart2 size={20} />, role: [UserRole.SchoolOwner] },
    { to: '/settings', label: t('settings'), icon: <SettingsIcon size={20} />, role: [UserRole.SchoolOwner] },
  ];

  if (!currentUser || currentUser.role === UserRole.SuperAdmin) return null;

  return (
    <aside className="w-72 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col p-4 shadow-lg rtl:border-l ltr:border-r border-gray-200 dark:border-gray-700/50 hidden lg:flex">
        <div className="flex-grow">
            <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700/50 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Idarati</h1>
            </div>
            <nav>
                <ul className="space-y-1">
                {navItems
                    .filter(item => item.role.includes(currentUser.role))
                    .map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} end={item.to === '/'} className={navLinkClass}>
                        {({ isActive }) => (
                            <>
                                <div className={`${iconClass({ isActive })} group`}>
                                    {item.icon}
                                </div>
                                <span className="ms-3 font-semibold">{item.label}</span>
                            </>
                        )}
                        </NavLink>
                    </li>
                    ))}
                </ul>
            </nav>
        </div>
      <div className="mt-auto">
        <button onClick={handleLogout} className="flex items-center w-full p-3 rounded-lg text-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors group">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 group-hover:bg-red-100 dark:group-hover:bg-red-900/50">
                <LogOut size={20} />
            </div>
            <span className="ms-3 font-semibold">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;