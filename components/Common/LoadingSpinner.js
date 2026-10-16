'use client';

import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <FiLoader className="animate-spin text-4xl text-indigo-600" />
    </div>
  );
}