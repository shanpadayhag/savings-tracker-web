import UserDataExport from '@/features/user/entities/user-data-export';
import { useRef, useState } from 'react';

const useAccountSettingsStates = () => {
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [importDialogIsOpen, setImportDialogIsOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<UserDataExport>();
  const [pendingImportFileName, setPendingImportFileName] = useState<string>();
  const [isImporting, setIsImporting] = useState(false);

  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  return {
    importFileInputRef,
    importDialogIsOpen, setImportDialogIsOpen,
    pendingImport, setPendingImport,
    pendingImportFileName, setPendingImportFileName,
    isImporting, setIsImporting,
    profileFirstName, setProfileFirstName,
    profileLastName, setProfileLastName,
    profileEmail, setProfileEmail,
    isSavingProfile, setIsSavingProfile,
  };
};

export default useAccountSettingsStates;
