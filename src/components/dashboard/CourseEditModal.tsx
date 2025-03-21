import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  onSave: (courseId: number, newName: string) => void;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  onSave
}) => {
  const [name, setName] = useState(courseName);

  // Reset the form when the modal opens with a new course
  useEffect(() => {
    setName(courseName);
  }, [courseName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(courseId, name);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Course">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-1">
            Course Name
          </label>
          <input
            type="text"
            id="courseName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseEditModal;
