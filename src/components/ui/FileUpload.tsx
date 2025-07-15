import React from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  className?: string;
  children: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  className = '',
  children 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <label className={`inline-block cursor-pointer rounded ${className}`}>
      <input 
        type="file" 
        onChange={handleChange} 
        className="hidden" 
        accept="image/*"
      />
      {children}
    </label>
  );
};

export default FileUpload;