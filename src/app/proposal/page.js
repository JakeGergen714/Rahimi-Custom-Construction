'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import InsertInvoiceModal from './modal';
import DateFilter from './datefilter';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

const AdminInvoicesPage2 = () => {
  const [invoices, setInvoices] = useState([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null); // Store the pagination key
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // New state for Load More button
  const [editInvoice, setEditInvoice] = useState(null);

  const contentRef = useRef([]);
  const dateFilterRef = useRef(null);
  const menuRef = useRef(null);

  const [filters, setFilters] = useState({
    date: null,
    paid: false,
    unpaid: false,
  });

  const [showDateFilter, setShowDateFilter] = useState(false);

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

  const applyDateFilter = (dateFilter) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      date: dateFilter,
    }));

    setTimeout(() => {
      setShowDateFilter(false);
    }, 10); // Set the delay to 100ms (can be tweaked as necessary)
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateFilterRef.current &&
        !dateFilterRef.current.contains(event.target)
      ) {
        setShowDateFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dateFilterRef]);

  const applyPaidFilter = (paid) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      paid: prevFilters.paid ? false : paid, // Toggle paid filter
      unpaid: false, // Ensure unpaid is reset when paid is selected
    }));
  };

  const applyUnpaidFilter = (unpaid) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      unpaid: prevFilters.unpaid ? false : unpaid, // Toggle unpaid filter
      paid: false, // Ensure paid is reset when unpaid is selected
    }));
  };

  const fetchAdminInvoices = async (isNextPage = false) => {
    try {
      const params = new URLSearchParams();

      // Add filters if they exist
      if (filters.paid) params.append('status', 'paid');
      if (filters.unpaid) params.append('status', 'open');
      if (filters.date) {
        params.append('startDate', filters.date.startDate.toISOString());
        params.append('endDate', filters.date.endDate.toISOString());
      }

      // If paginating, pass the last key
      if (isNextPage && lastEvaluatedKey) {
        params.append(
          'lastKey',
          encodeURIComponent(JSON.stringify(lastEvaluatedKey))
        );
      }

      const url = `/api/admin-proposal-fetch?${params.toString()}`;
      if (isNextPage) setIsLoadingMore(true);
      else setLoading(true);

      const response = await fetch(url, { method: 'GET' });

      if (response.status === 401) {
        window.location.href = 'login';
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        if (isNextPage) {
          setInvoices((prevInvoices) => {
            const combinedInvoices = [...prevInvoices, ...data.data];

            // Remove duplicates
            const uniqueInvoices = combinedInvoices.filter(
              (invoice, index, self) =>
                index === self.findIndex((i) => i.id === invoice.id)
            );

            return uniqueInvoices;
          });
        } else {
          setInvoices(data.data); // Reset with the new filtered data
        }
        console.log(data.lastKey);
        // Set the next key for pagination
        setLastEvaluatedKey(data.lastKey || null);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false); // End "Load More" loading state
    }
  };

  useEffect(() => {
    fetchAdminInvoices();
  }, [filters]);

  const handleCreateInvoice = async (newInvoice) => {
    console.log(newInvoice);
    if (!newInvoice.isProposal) {
      createPlainInvoice(newInvoice);
    } else {
      console.log('Is proposal');
      createPlainProposal(newInvoice);
    }
  };

  const createPlainInvoice = async (newInvoice) => {
    console.log('generating pdf from: ', newInvoice);
    try {
      // Correct method type: POST, since you're sending a body
      const invoicePdfResponse = await fetch(
        '/api/generate-plain-invoice-pdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInvoice), // This sends the invoice details to generate the PDF
        }
      );

      if (!invoicePdfResponse.ok) {
        throw new Error('Failed to create plain invoice');
      }

      fetchAdminInvoices(); // Assuming this refreshes your list of invoices
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const createPlainProposal = async (newInvoice) => {
    console.log('generating pdf from: ', newInvoice);
    try {
      // Correct method type: POST, since you're sending a body
      const invoicePdfResponse = await fetch(
        '/api/generate-plain-proposal-pdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInvoice), // This sends the invoice details to generate the PDF
        }
      );

      if (!invoicePdfResponse.ok) {
        throw new Error('Failed to create plain proposal');
      }

      fetchAdminInvoices(); // Assuming this refreshes your list of invoices
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const handleVoidInvoice = async (invoice) => {
    setVoidInvoice(null);

    setExpandedRowIndex(null);
    try {
      const response = await fetch('/api/admin-invoice-void', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        throw new Error('Failed to void invoice');
      } else {
        fetchAdminInvoices();
      }
    } catch (error) {
      console.error('Error voiding invoice:', error);
    }
  };

  const toggleRow = (index) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

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
              href='/invoices'
              className='text-white hover:text-blue-500 text-xl'
            >
              Invoices
            </a>
          </li>
          <li>
            <a
              href='/proposal'
              className='text-white hover:text-blue-500 text-xl'
            >
              Proposals
            </a>
          </li>
        </ul>
      </div>

      {/* Main content area */}
      <div className='flex-1 main-content-container bg-gray-200 w-4/5 h-full p-6 w-full'>
        <div className='innerContainer sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto flex flex-col h-full'>
          <h1 className='text-3xl font-semibold mb-6 text-black'>
            Admin Panel
          </h1>

          {/* Invoice Table */}
          <div className='bg-white p-4 shadow rounded-lg max-w-full flex flex-col flex-grow h-full min-h-0'>
            <h2 className='text-2xl font-medium mb-4 text-black'>Proposals</h2>

            {/* Filters */}
            <div className='flex flex-wrap pt-4 border-b pb-2 gap-2 sm:gap-4'>
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-blue-500 text-white rounded-lg px-2 py-1 sm:px-6 hover:bg-blue-600 transition-all ml-auto flex-grow sm:flex-grow-0'
              >
                + Create New Proposal
              </button>
            </div>
            {loading && (
              <div className='flex justify-center items-center h-full'>
                <div className='spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600'>
                  <span className='sr-only text-black'>Loading...</span>
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
                            {'PRO-' + String(invoice.id).padStart(6, '0')}{' '}
                          </td>
                          <td className='py-1 px-1'>
                            {invoice.amount_due.toFixed(2)}{' '}
                          </td>

                          <td
                            className='py-1 px-1 font-semibold max-w-10 truncate whitespace-nowrap overflow-hidden text-black'
                            title={invoice.customer_email}
                          >
                            {invoice.customer_email}
                          </td>
                          <td className='py-1 px-1'>{invoice.date}</td>
                        </tr>

                        {expandedRowIndex === index && (
                          <tr className='expanded-content'>
                            <td colSpan='5'>
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
                                    <div className='flex justify-between text-lg font-semibold text-gray-200'>
                                      <span>{invoice.customer_email}</span>
                                      <span>{invoice.number}</span>
                                    </div>
                                  </div>
                                  <div className='mb-4'>
                                    <p className='font-semibold text-lg text-gray-100 mb-2'>
                                      Proposal Details
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
                                        {invoice.amount_due.toFixed(2)}{' '}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setEditInvoice(invoice);
                                  setIsModalOpen(true);
                                }}
                                className='bg-green-700 text-white rounded-lg mb-2 px-2 py-1 sm:px-6 hover:bg-green-800 transition-all ml-auto flex-grow sm:flex-grow-0'
                              >
                                Generate Invoice
                              </button>
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
            {lastEvaluatedKey && (
              <div className='flex justify-center mt-4'>
                <button
                  onClick={() => fetchAdminInvoices(true)}
                  className='bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 transition-all'
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading More...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <InsertInvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditInvoice(null);
          }}
          onSubmit={handleCreateInvoice}
          editInvoice={editInvoice}
        />
      )}
    </div>
  );
};

export default AdminInvoicesPage2;
