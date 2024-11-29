'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  AiOutlinePlus,
  AiOutlineMinus,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineCheckCircle,
} from 'react-icons/ai';
import InsertInvoiceModal from './modal';

const AdminInvoicesPage2 = () => {
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const contentRef = useRef([]);
  const menuRef = useRef(null);

  const [filters, setFilters] = useState({
    year: null,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAdminInvoices = async () => {
    try {
      const params = new URLSearchParams();

      // Add year filter if it exists
      if (filters.year) params.append('year', filters.year);

      const url = `/api/admin-invoice-fetch?${params.toString()}`;
      setLoading(true);

      const response = await fetch(url, { method: 'GET' });

      if (response.status === 401) {
        window.location.href = 'login';
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setInvoices(data.data); // Reset with the new filtered data
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInvoices();
  }, [filters]);

  const handleCreateInvoice = async (newInvoice) => {
    if (newInvoice.useStripe) {
      createStripeInvoice(newInvoice);
    } else {
      createPlainInvoice(newInvoice);
    }
  };

  const createStripeInvoice = async (newInvoice) => {
    try {
      const response = await fetch('/api/admin-invoice-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvoice),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      await response.json();
      fetchAdminInvoices();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const createPlainInvoice = async (newInvoice) => {
    console.log('generating pdf from: ', newInvoice);
    try {
      const invoicePdfResponse = await fetch(
        '/api/generate-plain-invoice-pdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInvoice),
        }
      );

      if (!invoicePdfResponse.ok) {
        throw new Error('Failed to create plain invoice');
      }

      fetchAdminInvoices();
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const markInvoiceAsPaid = async (invoice) => {
    try {
      const response = await fetch('/api/mark-invoice-as-paid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      fetchAdminInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const toggleRow = (index) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  // Generate years dynamically (current year to 5 years back)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  // Calculate totals
  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + invoice.amount_due,
    0
  );
  const totalCollected = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount_due, 0);
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.amount_due, 0);

  return (
    <div className='flex h-screen'>
      {/* Hamburger Icon */}
      <div className='fixed top-4 left-4 z-50 md:hidden'>
        <button onClick={toggleSidebar} className='text-white text-2xl'>
          {isSidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-full w-32 bg-slate-700 p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:translate-x-0 md:static`}
      >
        <ul>
          <li className='mb-6 pt-4'>
            <a
              href='#invoices'
              className='text-white hover:text-blue-500 text-xl'
            >
              Invoices
            </a>
          </li>
          <li className='mb-6 pt-4'>
            <a
              href='/proposal'
              className='text-white hover:text-blue-500 text-xl'
            >
              Proposals
            </a>
          </li>
          <li className='mb-6 pt-4'>
            <a
              href='/images'
              className='text-white hover:text-blue-500 text-xl'
            >
              Images
            </a>
          </li>
        </ul>
      </div>

      {/* Main content area */}
      <div className='flex-1 main-content-container bg-gray-200 p-6 w-full'>
        <div className='innerContainer sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto flex flex-col h-full'>
          <h1 className='text-3xl font-semibold mb-6'>Admin Panel</h1>

          {/* Invoice Table */}
          <div className='bg-white p-4 shadow rounded-lg max-w-full flex flex-col flex-grow h-full min-h-0'>
            <h2 className='text-2xl font-medium mb-4'>Invoices</h2>

            {/* Year Filters */}
            <div className='flex flex-wrap pt-4 border-b pb-2 gap-2 sm:gap-4'>
              {years.map((year) => (
                <div
                  key={year}
                  onClick={() =>
                    setFilters((prevFilters) => ({
                      ...prevFilters,
                      year: prevFilters.year === year ? null : year, // Toggle the year filter
                    }))
                  }
                  className={`cursor-pointer rounded-full border-dashed border-2 px-2 text-slate-400 flex-grow sm:flex-grow-0 ${
                    filters.year === year ? 'bg-gray-200' : ''
                  }`}
                >
                  {year}
                </div>
              ))}
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-blue-500 text-white rounded-lg px-2 py-1 sm:px-6 hover:bg-blue-600 transition-all ml-auto flex-grow sm:flex-grow-0'
              >
                + Create New Invoice
              </button>
            </div>

            {/* Summary Section */}
            {!loading && (
              <div className='summary-section mt-4 mb-4'>
                <h3 className='text-xl font-semibold mb-2'>
                  Summary for {filters.year || 'All Years'}
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  <div className='bg-gray-100 p-4 rounded-lg'>
                    <p className='text-gray-600'>Total Invoiced</p>
                    <p className='text-2xl font-bold'>
                      ${totalInvoiced.toFixed(2)}
                    </p>
                  </div>
                  <div className='bg-gray-100 p-4 rounded-lg'>
                    <p className='text-gray-600'>Total Collected</p>
                    <p className='text-2xl font-bold'>
                      ${totalCollected.toFixed(2)}
                    </p>
                  </div>
                  <div className='bg-gray-100 p-4 rounded-lg'>
                    <p className='text-gray-600'>Total Outstanding</p>
                    <p className='text-2xl font-bold'>
                      ${totalOutstanding.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className='flex justify-center items-center h-full'>
                <div className='spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600'>
                  <span className='sr-only'>Loading...</span>
                </div>
              </div>
            )}

            {!loading && (
              <div className='table-container overflow-y-auto flex-grow min-h-0'>
                <table className='table-auto w-full text-center'>
                  <thead className='border-b'>
                    <tr>
                      <th className='py-1 px-1 text-gray-400 font-medium'></th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        ID
                      </th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        Amount Due
                      </th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        Customer Email
                      </th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        Created Date
                      </th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        Status
                      </th>
                      <th className='py-1 px-1 text-gray-400 font-medium'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='text-black divide-y-2 divide-gray-200'>
                    {invoices.map((invoice, index) => (
                      <React.Fragment key={invoice.id}>
                        <tr>
                          <td
                            className='py-2 px-1 pl-2 cursor-pointer text-blue-400 hover:text-blue-600'
                            onClick={() => toggleRow(index)}
                          >
                            {expandedRowIndex === index ? (
                              <AiOutlineMinus size={20} />
                            ) : (
                              <AiOutlinePlus size={20} />
                            )}
                          </td>
                          <td className='py-1 px-1'>
                            {'INV-' + String(invoice.id).padStart(6, '0')}
                          </td>
                          <td className='py-1 px-1'>
                            {invoice.amount_due.toFixed(2)}
                          </td>
                          <td
                            className='py-1 px-1 font-semibold max-w-10 truncate whitespace-nowrap overflow-hidden'
                            title={invoice.customer_email}
                          >
                            {invoice.customer_email}
                          </td>
                          <td className='py-1 px-1'>
                            {new Date(invoice.date).toLocaleDateString()}
                          </td>
                          <td className='py-1 px-1'>{invoice.status}</td>
                          <td className='py-1 px-1'>
                            {invoice.status === 'open' && (
                              <button
                                onClick={() => markInvoiceAsPaid(invoice)}
                                className='text-green-600 hover:text-green-800'
                                title='Mark As Paid'
                              >
                                <AiOutlineCheckCircle size={20} />
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRowIndex === index && (
                          <tr className='expanded-content'>
                            <td colSpan='7'>
                              <div
                                ref={(el) => (contentRef.current[index] = el)}
                                className='transition-all duration-500 ease-in-out overflow-hidden'
                                style={{
                                  maxHeight:
                                    expandedRowIndex === index
                                      ? contentRef.current[index]
                                          ?.scrollHeight + 'px'
                                      : '0px',
                                }}
                              >
                                <div className='py-1 px-1 sm:px-6 bg-slate-900 rounded-lg m-2 overflow-y-auto'>
                                  <div className='border-gray-600 mb-4'>
                                    <div className='flex justify-between text-lg font-semibold text-gray-200 border-b border-gray-600 p-2'>
                                      <div className='text-lg text-gray-200'>
                                        <span className='font-semibold'>
                                          Sent to -{' '}
                                        </span>
                                        <span className='font-normal'>
                                          <span>{invoice.customer_email}</span>
                                        </span>
                                      </div>
                                    </div>
                                    <div className='text-lg text-gray-200 border-b border-gray-600 p-2'>
                                      <span className='font-semibold'>
                                        Work Description -{' '}
                                      </span>
                                      <span className='font-normal'>
                                        {invoice.description}
                                      </span>
                                    </div>
                                  </div>
                                  <div className='mb-4'>
                                    <p className='font-semibold text-lg text-gray-100 mb-2'>
                                      Invoice Details
                                    </p>
                                    <div className='flex justify-between py-2 text-gray-400 font-semibold'>
                                      <span className='flex-1 text-left'>
                                        Description
                                      </span>
                                      <span className='w-20 text-center'>
                                        Quantity
                                      </span>
                                      <span className='w-20 text-right'>
                                        Unit Price
                                      </span>
                                    </div>
                                    <div className='border-t border-gray-600'>
                                      {invoice.lines.map((item, i) => (
                                        <div
                                          key={i}
                                          className='flex justify-between py-2 text-gray-400'
                                        >
                                          <span className='flex-1 text-left'>
                                            {item.description}
                                          </span>
                                          <span className='w-20 text-center font-medium'>
                                            {item.price.unit_quantity}
                                          </span>
                                          <span className='w-20 text-right font-medium'>
                                            {item.price.unit_amount}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className='border-t border-gray-600 pt-4'>
                                    <div className='flex justify-between text-lg font-semibold text-gray-200'>
                                      <span>Total</span>
                                      <span>
                                        {invoice.amount_due.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Removed the Mark As Paid button from the expanded content */}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More Button */}
            {/* Removed the Load More button since we're fetching all invoices for accurate totals */}
          </div>
        </div>
      </div>

      {/* Modal for Creating New Invoice */}
      {isModalOpen && (
        <InsertInvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateInvoice}
        />
      )}
    </div>
  );
};

export default AdminInvoicesPage2;
