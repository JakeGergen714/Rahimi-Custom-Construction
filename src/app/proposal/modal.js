import React, { useState, useEffect } from 'react';

const InsertInvoiceModal = ({ isOpen, onClose, onSubmit, editInvoice }) => {
  const [title, setTitle] = useState(null);

  const [invoice, setInvoice] = useState({
    customer_email: '',
    customer_name: '',
    description: '',
    lines: [], // Additional optional line items
    useStripe: false, // New field to track whether to use Stripe
    amount_due: 0,
  });

  useEffect(() => {
    if (editInvoice) {
      const firstLaborLine = editInvoice.lines.find((line) =>
        line.description.startsWith('Labor')
      );

      // Filter out the firstLaborLine
      const filteredLines = editInvoice.lines.filter(
        (line) => line !== firstLaborLine
      );

      const updatedInvoice = {
        ...editInvoice,
        lines: filteredLines, // Use the filtered lines array without firstLaborLine
        hoursWorked: firstLaborLine
          ? firstLaborLine.price.unit_amount
          : undefined,
        ratePerHour: firstLaborLine
          ? firstLaborLine.price.unit_quantity
          : undefined,
        isProposal: false,
      };

      setInvoice(updatedInvoice);
      setTitle('Convert Proposal To Invoice');
    } else {
      setInvoice({
        customer_email: '',
        customer_name: '',
        description: '',
        lines: [], // Additional optional line items
        useStripe: false, // New field to track whether to use Stripe
        amount_due: 0,
        isProposal: true,
      });
      setTitle('Create New Proposal');
    }
  }, []);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Capitalize the first letter of each word and lowercase the rest
  const capitalizeTitle = (text) => {
    return text.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  };

  const validateAndFormatInput = (name, value) => {
    if (
      [
        'hoursWorked',
        'ratePerHour',
        'materialCost',
        'amount',
        'quantity',
      ].includes(name)
    ) {
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

  // Handle input change for invoice fields
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setInvoice((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
    } else {
      // Call validateAndFormatInput for all non-checkbox inputs
      validateAndFormatInput(name, value);
    }
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;

    // Format and validate input value
    let formattedValue =
      name === 'description'
        ? capitalizeTitle(value)
        : name === 'amount'
        ? value
            .replace(/^0+(\d)/, '$1')
            .replace(/[^0-9.]/g, '')
            .replace(/(\.\d{2})\d+$/, '$1')
            .replace(/\.(?=.*\.)/g, '') // Remove leading zeros and non-numeric characters
        : name === 'quantity'
        ? value
            .replace(/^0+(\d)/, '$1') // Remove leading zeros
            .replace(/[^0-9]/g, '') // Allow only numeric characters
        : 0;

    const updatedLineItems = invoice.lines.map((item, i) =>
      i === index
        ? {
            ...item,
            ...(name === 'amount'
              ? { price: { ...item.price, unit_amount: formattedValue } }
              : name === 'quantity'
              ? { price: { ...item.price, unit_quantity: formattedValue } }
              : { [name]: formattedValue }),
          }
        : item
    );

    setInvoice((prevState) => ({
      ...prevState,
      lines: updatedLineItems,
    }));
  };

  // Add new line item
  const addLineItem = () => {
    setInvoice({
      ...invoice,
      lines: [
        ...invoice.lines,
        {
          description: '',
          price: {
            unit_amount: 0,
            unit_quantity: 0,
          },
        },
      ],
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    const updatedLineItems = invoice.lines.filter((_, i) => i !== index);
    setInvoice({
      ...invoice,
      lines: updatedLineItems,
    });
  };

  // Automatically add labor and material costs to line items
  const formatLineItems = () => {
    const laborCost = {
      description: `Labor`,
      price: {
        unit_amount: parseFloat(invoice.ratePerHour) || 0,
        unit_quantity: parseFloat(invoice.hoursWorked) || 0,
      },
    };

    return [laborCost, ...invoice.lines];
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConfirmationOpen(true);
  };

  const confirmSubmit = () => {
    const formattedLineItems = formatLineItems();
    const totalAmount = formattedLineItems.reduce(
      (total, item) =>
        total +
        Number(item.price.unit_amount) * Number(item.price.unit_quantity),
      0
    );

    const fullInvoice = {
      ...invoice,
      lines: formattedLineItems,
      amount_due: totalAmount,
    };

    onSubmit(fullInvoice);
    setIsConfirmationOpen(false);
    onClose(); // Close the modal after submission
  };

  if (!isOpen) return null;

  const formattedLineItems = formatLineItems();
  const totalAmount = formattedLineItems.reduce(
    (total, item) =>
      total + Number(item.price.unit_amount) * Number(item.price.unit_quantity),
    0
  );

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 p-4 overflow-y-auto'>
      <div className='bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl w-full flex flex-col sm:flex-row overflow-y-auto max-h-screen'>
        {/* Left side: Invoice form */}
        <div className='w-full sm:w-1/2 sm:pr-4 mb-6 sm:mb-0'>
          <h2 className='text-xl sm:text-2xl font-bold mb-4 text-black'>
            {editInvoice ? 'Create New Invoice' : 'Create New Proposal'}
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Customer Email */}
            <div className='mb-4'>
              <label className='block text-gray-700 text-black'>
                Customer Email
              </label>
              <input
                type='email'
                name='customer_email'
                value={invoice.customer_email}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-lg p-2 text-black'
                required
              />
            </div>
            <div className='mb-4'>
              <label className='block text-gray-700 text-black'>
                Customer Name
              </label>
              <input
                type='text'
                name='customer_name'
                value={invoice.customer_name}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-lg p-2 text-black'
                required
              />
            </div>
            <div className='mb-4'>
              <label className='block text-gray-700 text-black'>
                Work Description
              </label>
              <textarea
                name='description'
                value={invoice.description}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-lg p-2 text-black'
                rows={4}
                required
              />
            </div>
            <div className='flex gap-1 flex-col sm:flex-row'>
              {/* Hours Worked */}
              <div className='mb-4 sm:mb-0 sm:mr-2'>
                <label className='block text-gray-700 text-black'>
                  Hours Worked
                </label>
                <input
                  type='text'
                  name='hoursWorked'
                  value={invoice.hoursWorked}
                  onChange={handleInputChange}
                  className='w-full border border-gray-300 rounded-lg p-2 text-black'
                  required
                />
              </div>
              {/* Rate per Hour */}
              <div className='mb-4'>
                <label className='block text-gray-700 text-black'>
                  Rate ($/Hour)
                </label>
                <input
                  type='text'
                  name='ratePerHour'
                  value={invoice.ratePerHour}
                  onChange={handleInputChange}
                  className='w-full border border-gray-300 rounded-lg p-2 text-black'
                  required
                />
              </div>
            </div>
            {/* Additional Line Items */}
            <div className='mb-4'>
              <label className='block text-black pb-8 font-bold pt-2'>
                Additional Line Items (Optional)
              </label>
              {invoice.lines.map((item, index) => (
                <div
                  key={index}
                  className='mb-2 flex gap-4 flex-wrap bg-stone-300 p-4 rounded-lg'
                >
                  <div className='flex flex-col'>
                    <label className='flex block text-gray-700 text-black'>
                      Item Description
                    </label>
                    <textarea
                      name='description'
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, e)}
                      className='w-full border border-gray-300 rounded-lg p-2 text-black'
                      rows={4}
                      required
                    />
                  </div>

                  <div className='flex flex-col'>
                    <label className='flex block text-gray-700 text-black'>
                      Quantity
                    </label>
                    <input
                      type='text'
                      name='quantity'
                      value={item.price.unit_quantity}
                      onChange={(e) => handleLineItemChange(index, e)}
                      placeholder='Quantity'
                      className='flex w-28 border border-gray-300 rounded-lg p-2 text-black'
                      required
                    />{' '}
                  </div>

                  <div className='flex flex-col'>
                    {' '}
                    <label className='block text-gray-700 text-black'>
                      Price Per Unit $
                    </label>
                    <input
                      type='text'
                      name='amount'
                      value={item.price.unit_amount}
                      onChange={(e) => handleLineItemChange(index, e)}
                      placeholder='Amount'
                      className='w-28 border border-gray-300 rounded-lg p-2 text-black'
                      required
                    />{' '}
                  </div>

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
                {editInvoice ? 'Send Invoice' : 'Send Proposal'}
              </button>
            </div>
          </form>
        </div>

        {/* Right side: Invoice preview */}
        <div className='w-full sm:w-1/2 sm:pl-4'>
          <h2 className='text-xl sm:text-2xl font-bold mb-4'>
            {editInvoice ? 'Invoice Preview' : 'Proposal Preview'}
          </h2>
          <div className='p-4 bg-gray-800 text-white rounded-lg shadow-lg'>
            <div className='mb-4'>
              <p className='font-semibold text-lg mb-2'>
                {editInvoice ? 'Invoice Details' : 'Proposal Details'}
              </p>
              <div className='border-t border-gray-600'>
                <p className='font-semibold text-lg mb-2'>
                  Work Description:{' '}
                  <span className='font-normal text-base'>
                    {invoice.description}
                  </span>
                </p>
                <div className='flex justify-between py-2 text-gray-400 font-semibold'>
                  <span>Description</span>
                  <span>Quantity</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                </div>

                {formattedLineItems.map((item, i) => (
                  <div
                    key={i}
                    className='flex justify-between py-2 text-gray-400'
                  >
                    <span className='w-24'>{item.description}</span>
                    <span className='font-medium'>
                      {Number(item.price.unit_quantity)}
                    </span>
                    <span className='font-medium'>
                      {Number(item.price.unit_amount)}
                    </span>
                    <span className='font-medium'>
                      $
                      {Number(
                        item.price.unit_amount * item.price.unit_quantity
                      ).toFixed(2)}
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
          <div className='bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-lg w-full'>
            <h2 className='text-xl sm:text-2xl font-bold mb-4'>
              Confirm Invoice
            </h2>
            <p className='mb-4'>
              Customer Email: <strong>{invoice.customer_email}</strong>
            </p>
            <p>
              {editInvoice
                ? 'Are you sure you want to submit this invoice?'
                : 'Are you sure you want to submit this proposal?'}
            </p>
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
