import React, { useState, useEffect } from 'react';

const InsertInvoiceModal = ({ isOpen, onClose, onSubmit }) => {
  const [invoice, setInvoice] = useState({
    customerEmail: '',
    hoursWorked: '',
    ratePerHour: '',
    materialCost: '',
    lineItems: [], // Additional optional line items
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Helper function to ensure numbers are valid and prevent leading zeros
  const validateAndFormatInput = (name, value) => {
    if (['hoursWorked', 'ratePerHour', 'materialCost'].includes(name)) {
      const validInput = value.replace(/^0+(\d)/, '$1').replace(/[^0-9.]/g, '');
      if (/^\d*\.?\d{0,2}$/.test(validInput)) {
        setInvoice((prevState) => ({
          ...prevState,
          [name]: validInput,
        }));
      }
    } else {
      setInvoice((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // Capitalize the first letter of each word and lowercase the rest
  const capitalizeTitle = (text) => {
    return text.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  };

  // Handle input change for invoice fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    validateAndFormatInput(name, value);
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;

    const formattedValue =
      name === 'description'
        ? capitalizeTitle(value)
        : value.replace(/^0+(\d)/, '$1'); // Remove leading zeros for numeric inputs

    // Apply the numeric validation and formatting for 'amount'
    if (name === 'amount') {
      if (!/^\d*\.?\d{0,2}$/.test(formattedValue)) {
        return; // Prevent invalid input from being set
      }
    }

    const updatedLineItems = invoice.lineItems.map((item, i) =>
      i === index
        ? {
            ...item,
            [name]: formattedValue,
          }
        : item
    );

    setInvoice({
      ...invoice,
      lineItems: updatedLineItems,
    });
  };

  // Add new line item
  const addLineItem = () => {
    setInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, { description: '', amount: '' }],
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    const updatedLineItems = invoice.lineItems.filter((_, i) => i !== index);
    setInvoice({
      ...invoice,
      lineItems: updatedLineItems,
    });
  };

  // Automatically add labor and material costs to line items
  const formatLineItems = () => {
    const laborCost = {
      description: `Labor: ${invoice.hoursWorked} hours @ $${invoice.ratePerHour}/hr`,
      amount:
        parseFloat(invoice.hoursWorked) * parseFloat(invoice.ratePerHour) || 0,
    };

    const materialCost = {
      description: 'Material Costs',
      amount: parseFloat(invoice.materialCost) || 0,
    };

    return [laborCost, materialCost, ...invoice.lineItems];
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConfirmationOpen(true);
  };

  const confirmSubmit = () => {
    const formattedLineItems = formatLineItems();
    const totalAmount = formattedLineItems.reduce(
      (total, item) => total + Number(item.amount),
      0
    );

    const fullInvoice = {
      ...invoice,
      lineItems: formattedLineItems,
      amount: totalAmount,
    };

    onSubmit(fullInvoice);
    setIsConfirmationOpen(false);
    onClose(); // Close the modal after submission
  };

  if (!isOpen) return null;

  const formattedLineItems = formatLineItems();
  const totalAmount = formattedLineItems.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
      <div className='bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full flex'>
        {/* Left side: Invoice form */}
        <div className='w-1/2 pr-4'>
          <h2 className='text-2xl font-bold mb-4'>Add New Invoice</h2>
          <form onSubmit={handleSubmit}>
            {/* Customer Email */}
            <div className='mb-4'>
              <label className='block text-gray-700'>Customer Email</label>
              <input
                type='email'
                name='customerEmail'
                value={invoice.customerEmail}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-lg p-2'
                required
              />
            </div>
            <div className='flex gap-1'>
              {/* Hours Worked */}
              <div className='mb-4'>
                <label className='block text-gray-700'>Hours Worked</label>
                <input
                  type='text'
                  name='hoursWorked'
                  value={invoice.hoursWorked}
                  onChange={handleInputChange}
                  className='w-full border border-gray-300 rounded-lg p-2'
                  required
                />
              </div>

              {/* Rate per Hour */}
              <div className='mb-4'>
                <label className='block text-gray-700'>Rate ($/Hour)</label>
                <input
                  type='text'
                  name='ratePerHour'
                  value={invoice.ratePerHour}
                  onChange={handleInputChange}
                  className='w-full border border-gray-300 rounded-lg p-2'
                  required
                />
              </div>
            </div>

            {/* Material Costs */}
            <div className='mb-4'>
              <label className='block text-gray-700'>Material Costs</label>
              <input
                type='text'
                name='materialCost'
                value={invoice.materialCost}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-lg p-2'
                required
              />
            </div>

            {/* Additional Line Items */}
            <div className='mb-4'>
              <label className='block text-gray-700'>
                Additional Line Items (Optional)
              </label>
              {invoice.lineItems.map((item, index) => (
                <div key={index} className='mb-2 flex'>
                  <input
                    type='text'
                    name='description'
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, e)}
                    placeholder='Description'
                    className='flex-1 border border-gray-300 rounded-lg p-2 mr-2'
                  />
                  <input
                    type='text'
                    name='amount'
                    value={item.amount}
                    onChange={(e) => handleLineItemChange(index, e)}
                    placeholder='Amount'
                    className='w-28 border border-gray-300 rounded-lg p-2'
                  />
                  <button
                    type='button'
                    className='ml-2 text-red-600 hover:text-red-800'
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type='button'
                className='text-blue-500 hover:text-blue-700 mt-2'
                onClick={addLineItem}
              >
                + Add Line Item
              </button>
            </div>

            {/* Submit Button */}
            <div className='flex justify-end'>
              <button
                type='button'
                className='bg-gray-400 text-white rounded-lg px-4 py-2 mr-2'
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='bg-blue-500 text-white rounded-lg px-4 py-2'
              >
                Next
              </button>
            </div>
          </form>
        </div>

        {/* Right side: Invoice preview */}
        <div className='w-1/2 pl-4'>
          <h2 className='text-2xl font-bold mb-4'>Invoice Preview</h2>
          <div className='p-4 bg-gray-800 text-white rounded-lg shadow-lg'>
            <div className='mb-4'>
              <p className='font-semibold text-lg mb-2'>Invoice Details</p>
              <div className='border-t border-gray-600'>
                {formattedLineItems.map((item, i) => (
                  <div
                    key={i}
                    className='flex justify-between py-2 text-gray-400'
                  >
                    <span>{item.description}</span>
                    <span className='font-medium'>
                      ${Number(item.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className='border-t border-gray-600 pt-4'>
              <div className='flex justify-between text-lg font-semibold text-gray-200'>
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isConfirmationOpen && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
          <div className='bg-white p-8 rounded-lg shadow-lg max-w-lg w-full'>
            <h2 className='text-2xl font-bold mb-4'>Confirm Invoice</h2>
            <p className='mb-4'>
              Customer Email: <strong>{invoice.customerEmail}</strong>
            </p>
            <p>Are you sure you want to submit this invoice?</p>
            <div className='flex justify-end mt-4'>
              <button
                className='bg-gray-400 text-white rounded-lg px-4 py-2 mr-2'
                onClick={() => setIsConfirmationOpen(false)}
              >
                Cancel
              </button>
              <button
                className='bg-blue-500 text-white rounded-lg px-4 py-2'
                onClick={confirmSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsertInvoiceModal;
