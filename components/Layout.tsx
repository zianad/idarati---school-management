import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useAppContext } from '../hooks/useAppContext.ts';
import { ArrowLeft } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
    const { originalUser, stopImpersonating, currentUser, findSchool } = useAppContext();
    const { t } = useLanguage();
    
    if (!originalUser) {
        return null;
    }

    const school = currentUser?.schoolId ? findSchool(currentUser.schoolId) : null;
    const schoolName = school?.name || '...';
    
    return (
        <div className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white text-center p-3 font-semibold flex justify-between items-center print:hidden shadow-md z-50 relative">
            <span className="text-sm md:text-base">
                {t('impersonationNotice', { schoolName: schoolName })}
            </span>
            <button
                onClick={stopImpersonating}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors shadow"
            >
                <ArrowLeft size={16} />
                {t('returnToSuperAdmin')}
            </button>
        </div>
    );
};


const Layout: React.FC = () => {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
            <ImpersonationBanner />
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
