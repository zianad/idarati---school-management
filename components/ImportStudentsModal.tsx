

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../hooks/useLanguage.ts';
import { useAppContext } from '../hooks/useAppContext.ts';
import { School, Student } from '../types/index.ts';
import Modal from './Modal.tsx';
import { UploadCloud, Download, FileText, XCircle } from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
}

type StudentImportData = Omit<Student, 'id' | 'registrationDate'>;
type FailedImport = { name: string; reason: string; };

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose, school }) => {
  const { t } = useLanguage();
  const { addStudentsBulk, currentUser } = useAppContext();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [successfulImports, setSuccessfulImports] = useState<StudentImportData[]>([]);
  const [failedImports, setFailedImports] = useState<FailedImport[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setSuccessfulImports([]);
    setFailedImports([]);
    setShowSummary(false);
  };
  
  const handleClose = () => {
      resetState();
      onClose();
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setShowSummary(false);
      setSuccessfulImports([]);
      setFailedImports([]);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(isOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };
  
  const downloadTemplate = () => {
    const requiredColumns = [
        'name', 
        'parentPhone', 
        'level', 
        'group', 
        'subjects (comma-separated)', 
        'courses (comma-separated)', 
        'schoolName (optional)'
    ];
    const wsData = [requiredColumns];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    const validationSheetData: (string | number)[][] = [['Levels']];
    school.levels.forEach(l => validationSheetData.push([l.name]));
    validationSheetData.push([]);
    validationSheetData.push(['Groups', '(Level)']);
    school.groups.forEach(g => {
        const levelName = school.levels.find(l => l.id === g.levelId)?.name || 'N/A';
        validationSheetData.push([g.name, levelName]);
    });
    validationSheetData.push([]);
    validationSheetData.push(['Subjects', '(Level)']);
    school.subjects.forEach(s => {
         const levelName = school.levels.find(l => l.id === s.levelId)?.name || 'N/A';
        validationSheetData.push([s.name, levelName]);
    });
    validationSheetData.push([]);
    validationSheetData.push(['Courses']);
    school.courses.forEach(c => validationSheetData.push([c.name]));
    
    const validationWs = XLSX.utils.aoa_to_sheet(validationSheetData);
    
    XLSX.utils.book_append_sheet(wb, ws, "Student Template");
    XLSX.utils.book_append_sheet(wb, validationWs, "Available Data");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  const processFile = async () => {
    if (!file || !currentUser?.schoolId) return;

    setIsProcessing(true);
    setShowSummary(false);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const newSuccessful: StudentImportData[] = [];
        const newFailed: FailedImport[] = [];

        json.forEach(row => {
          const { 
              name, 
              parentPhone, 
              level: levelName, 
              group: groupName, 
              'subjects (comma-separated)': subjectNames, 
              'courses (comma-separated)': courseNames, 
              'schoolName (optional)': schoolName 
          } = row;
          
          if (!name || !parentPhone || !levelName || !groupName) {
            newFailed.push({ name: name || 'Unnamed', reason: t('missingRequiredFields') });
            return;
          }

          const level = school.levels.find(l => l.name.trim().toLowerCase() === String(levelName).trim().toLowerCase());
          if (!level) {
            newFailed.push({ name, reason: t('levelNotFound', { levelName }) });
            return;
          }

          const group = school.groups.find(g => g.name.trim().toLowerCase() === String(groupName).trim().toLowerCase() && g.levelId === level.id);
          if (!group) {
            newFailed.push({ name, reason: t('groupNotFound', { groupName }) });
            return;
          }

          const subjectIds = (String(subjectNames || '').split(','))
            .map(sName => {
              const subject = school.subjects.find(s => s.name.trim().toLowerCase() === sName.trim().toLowerCase());
              return subject ? subject.id : null;
            }).filter((id): id is string => id !== null);

          const courseIds = (String(courseNames || '').split(','))
            .map(cName => {
                const course = school.courses.find(c => c.name.trim().toLowerCase() === cName.trim().toLowerCase());
                return course ? course.id : null;
            }).filter((id): id is string => id !== null);

          newSuccessful.push({
            name,
            parentPhone: String(parentPhone),
            levelId: level.id,
            groupIds: [group.id],
            subjectIds,
            courseIds,
            schoolName: schoolName || '',
          });
        });
        
        setSuccessfulImports(newSuccessful);
        setFailedImports(newFailed);
        setShowSummary(true);

      } catch (error) {
        console.error("Error processing Excel file:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (successfulImports.length > 0 && currentUser?.schoolId) {
        await addStudentsBulk(currentUser.schoolId, successfulImports);
        handleClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('importStudents')}>
      {!showSummary ? (
        <div className="space-y-6">
          <div>
              <h3 className="font-bold text-lg mb-2">{t('instructions')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('importInstructions')}</p>
              <button onClick={downloadTemplate} className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                  <Download size={16} /> {t('downloadTemplate')}
              </button>
          </div>
          <div 
            onDragOver={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDrop={handleDrop}
            className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={(e) => handleFileChange(e.target.files)} 
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadCloud size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">{t('dragAndDrop')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('orBrowse')}</p>
            </label>
          </div>
          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                    <FileText size={24} className="text-blue-500" />
                    <span className="font-semibold">{file.name}</span>
                </div>
                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                    <XCircle size={20} />
                </button>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button 
              onClick={processFile}
              disabled={!file || isProcessing}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? t('processingFile') : t('import')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">{t('importSummary')}</h3>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md">
                {t('studentsImported', { count: successfulImports.length })}
            </div>
            {failedImports.length > 0 && (
                 <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-md">
                    {t('studentsFailed', { count: failedImports.length })}
                </div>
            )}
            {failedImports.length > 0 && (
                <div className="max-h-40 overflow-y-auto border dark:border-gray-600 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-2 text-left rtl:text-right font-semibold">{t('studentName')}</th>
                                <th className="p-2 text-left rtl:text-right font-semibold">{t('reasonForFailure')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {failedImports.map((fail, index) => (
                                <tr key={index} className="border-t dark:border-gray-600">
                                    <td className="p-2">{fail.name}</td>
                                    <td className="p-2 text-red-600 dark:text-red-400">{fail.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button 
                    onClick={handleImport}
                    disabled={successfulImports.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {t('add')} ({successfulImports.length})
                </button>
            </div>
        </div>
      )}
    </Modal>
  );
};
export default ImportStudentsModal;
