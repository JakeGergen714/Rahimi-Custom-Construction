import React from 'react';
import { RxHamburgerMenu } from 'react-icons/rx';

const InvoiceActions = ({
  invoice,
  isOpen,
  voidAction,
  setInvoiceMenuOpen,
}) => {
  const status = invoice.status.toLowerCase(); // Convert status to lowercase
  const isUnpaid = status === 'unpaid';

  return (
    <div className='relative'>
      <div className='cursor-pointer flex justify-center items-center'>
        <RxHamburgerMenu />
      </div>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50'>
          {isUnpaid ? (
            <div>
              {console.log('Rendering Void Invoice button')}
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Ensure the click doesn't propagate to parent
                  console.log('Void Invoice clicked'); // Check if this logs
                  voidAction(invoice.id); // Call the void action when clicked
                }}
                className='cursor-pointer px-4 py-2 text-red-600 hover:bg-gray-100 bg-black z-50'
              >
                Void Invoice
              </div>
            </div>
          ) : (
            <div className='px-4 py-2 text-gray-500'>No Actions Available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceActions;
