import React, { useCallback } from 'react'

interface FileUploadProps {
  accept: string
  label: string
  onFileUpload: (file: File) => void
}

const FileUpload: React.FC<FileUploadProps> = ({ accept, label, onFileUpload }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0])
      e.target.value = '' // Reset input
    }
  }, [onFileUpload])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-sm text-gray-500 mt-2">Click to upload</p>
          </div>
          <input 
            type="file" 
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}

export default FileUpload