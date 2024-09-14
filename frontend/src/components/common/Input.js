import React from 'react';

const Input = ({ type, value, onChange, placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
  />
);

export default Input;