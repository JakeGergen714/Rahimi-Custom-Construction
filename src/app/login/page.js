'use client';

import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './page.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState(''); // Stores the user's email
  const [code, setCode] = useState(''); // Stores the verification code
  const [step, setStep] = useState(1); // Track which step (1: email input, 2: code input)
  const [loading, setLoading] = useState(false); // Track loading state for sending the code
  const [invalidCode, setInvalidCode] = useState(false); // Track invalid code state

  // Handle email submission with loading animation
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading animation

    // Call your backend to send the validation code to the email
    const response = await fetch('/api/send-email-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    setLoading(false); // Stop loading animation after response

    if (response.ok) {
      // If the email is successfully sent, move to the next step (code input)
      setStep(2);
      toast.success('2FA code sent to your email!');
    } else {
      const { error } = await response.json();
      toast.error(error || 'Failed to send code. Please try again.');
    }
  };

  // Handle validation code submission with invalid code handling
  const handleCodeSubmit = async (e) => {
    e.preventDefault();

    // Call your backend to validate the email code
    const response = await fetch('/api/validate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (response.ok) {
      // If the code is valid, redirect to the admin dashboard or another page
      window.location.href = '/invoices';
    } else {
      const { error } = await response.json();
      toast.error(error || 'Invalid code. Please try again.');
      // Trigger invalid code feedback (red button and shaking)
      setInvalidCode(true);
      setTimeout(() => {
        setInvalidCode(false); // Reset button state after 2 seconds
      }, 2000);
    }
  };

  // Handle resending the code
  const handleResendCode = async () => {
    // Call your backend to resend the validation code
    const response = await fetch('/api/send-email-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      toast.success('A new code has been sent to your email.');
    } else {
      const { error } = await response.json();
      toast.error(error || 'Failed to resend code. Please try again.');
    }
  };

  // Return to "Enter email" step
  const handleBackToEmail = () => {
    setStep(1); // Go back to email entry step
    setCode(''); // Clear the code
  };

  return (
    <div className='landing-page-container w-full h-screen flex flex-col items-center justify-center relative'>
      <div className='landing-page-overlay'></div>

      {/* Title Section */}
      <div className='flex flex-col items-center justify-center text-white z-10'>
        <div className='invoice-title text-center'>
          <div className='text-6xl font-bold'>Rahmimi Custom Construction</div>
          <div className='title-sub text-2xl mt-4'>
            Please verify your identity
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className='flex flex-col z-10 p-8 rounded-lg text-black mt-32 mb-64 max-w-2xl min-w-[620px] mx-auto'>
        <h1 className='text-4xl text-white font-semibold mb-8 text-center'>
          {step === 1 ? 'Please verify your email' : 'Enter verification code'}
        </h1>

        {step === 1 ? (
          <form
            onSubmit={handleEmailSubmit}
            className='email-form mb-8 flex flex-col items-center'
          >
            <input
              type='email'
              placeholder='Enter your email'
              className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full mb-4'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type='submit'
              className='bg-blue-800 text-white rounded-lg px-6 py-2 hover:bg-blue-600 transition-all w-full flex items-center justify-center'
              disabled={loading} // Disable the button while loading
            >
              {loading ? (
                <svg
                  className='animate-spin h-5 w-5 mr-3 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                  ></path>
                </svg>
              ) : (
                'Send 2FA Code'
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleCodeSubmit}
            className='email-form mb-8 flex flex-col items-center'
          >
            <p className='text-gray-400 mb-4'>
              Verification code sent to {email}
            </p>
            <input
              type='text'
              placeholder='Enter verification code'
              className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full mb-4'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button
              type='submit'
              className={`${
                invalidCode
                  ? 'bg-red-600 text-white shake-animation' // Add shake and red background if invalid code
                  : 'bg-green-800 text-white'
              } rounded-lg px-6 py-2 hover:bg-blue-600 transition-all w-full`}
            >
              Verify Code
            </button>
            <button
              onClick={handleResendCode}
              className='bg-transparent text-blue-300 rounded-lg px-6 py-2 mt-4 transition-all'
            >
              Resend Code
            </button>
            <button
              onClick={handleBackToEmail}
              className='bg-transparent text-blue-300 rounded-lg px-6 py-2 mt-2 transition-all'
            >
              Enter a different email
            </button>
          </form>
        )}
      </div>

      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

export default AdminLoginPage;
