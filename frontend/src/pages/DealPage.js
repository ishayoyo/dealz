import React from 'react';
import { useParams } from 'react-router-dom';

const DealPage = () => {
  const { id } = useParams();
  
  // Use the id, for example:
  console.log(`Deal ID: ${id}`);

  return (
    <div className="deal-page">
      <h1>Deal Details for ID: {id}</h1>
      {/* Display deal details here */}
    </div>
  );
};

export default DealPage;