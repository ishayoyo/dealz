import { useState } from 'react';
import PostDealForm from './PostDealForm';

interface PostDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDealModal({ isOpen, onClose }: PostDealModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto my-8">
        <div className="p-6 lg:p-8 overflow-y-auto max-h-[80vh]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Post a New Deal</h2>
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <PostDealForm onSubmitSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}