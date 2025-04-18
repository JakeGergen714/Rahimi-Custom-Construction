'use client';

import React, { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSearchParams, useRouter } from 'next/navigation';

const PaidInvoicePage = () => {
  return (
    <div className='landing-page-container w-full h-screen flex flex-col items-center justify-center relative'>
      <div className='landing-page-overlay'></div>
      <header
        className='absolute top-0 left-0 w-full z-20'
        onClick={() => router.push('/')}
      >
        <div className='p-6 text-white font-bold text-left cursor-pointer'>
          <div className='text-1xl leading-tight'>Rahimi</div>
          <div className='text-1xl leading-tight'>Custom</div>
          <div className='text-1xl leading-tight'>Construction</div>
        </div>
      </header>

      {/* Suspense Boundary */}
      <Suspense fallback={<div className='text-white'>Loading...</div>}>
        <Content />
      </Suspense>

      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

const Content = () => {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id'); // Retrieve the 'id' query parameter
  const router = useRouter(); // For navigation

  const invoiceNumber = `INV-${String(invoiceId).padStart(6, '0')}`;

  return (
    <div className='flex flex-col z-10 p-8 rounded-lg text-black mt-32 mb-64 max-w-2xl min-w-[620px] mx-auto'>
      <div className='text-white'>
        <h1 className='text-4xl font-semibold mb-8 text-center'>
          Payment Received
        </h1>
        <div className='bg-gray-800 p-6 rounded-lg shadow-lg'>
          <p className='text-lg'>
            <span className='font-bold'>Invoice ID:</span> {invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaidInvoicePage;
