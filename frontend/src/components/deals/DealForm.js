import React, { useState } from 'react';

const DealForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    url: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Add form fields here */}
      <button type="submit">Submit Deal</button>
    </form>
  );
};

export default DealForm;