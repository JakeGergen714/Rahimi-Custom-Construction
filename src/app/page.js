import Head from 'next/head';
import Image from 'next/image';
import HomeGallery from './components/HomeGallery';

export default function Home() {
  return (
    <div>
      <Head>
        <title>
          Rahimi Custom Construction | Custom Woodworking & Home Renovations in
          Knoxville, TN
        </title>
        <meta
          name='description'
          content='Rahimi Custom Construction specializes in custom woodworking, home renovations, and design services in Knoxville, TN. Whether you need custom shelves, decks, stairs, or full home renovations, we bring your vision to life with expert craftsmanship.'
        />
        <meta
          name='keywords'
          content='custom woodworking, home renovations, Knoxville, TN, custom shelves, decks, home design, expert craftsmanship'
        />
        <meta name='author' content='Rahimi Custom Construction' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <script type='application/ld+json'>
          {`
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Rahimi Custom Construction",
        "description": "Rahimi Custom Construction offers custom woodworking, home renovations, and design services in Knoxville, TN.",
        "url": "https://rahimicustomconstruction.com",
        "telephone": "+1-123-456-7890",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "6026 Bayonet LN",
          "addressLocality": "Knoxville",
          "addressRegion": "TN",
          "postalCode": "37920",
          "addressCountry": "US"
        },
        "openingHours": "Mo-Fr 08:00-18:00",
        "priceRange": "$$",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "35.9606",
          "longitude": "-83.9207"
        },
        "serviceArea": {
          "@type": "Place",
          "name": "Knoxville"
        },
        "hasMap": "https://www.google.com/maps/place/35.9606,-83.9207"
      }
    `}
        </script>
      </Head>

      <header className='absolute top-0 left-0 w-full z-20 '>
        <div className='p-6 text-white font-bold text-left'>
          <div className='text-1xl leading-tight'>Rahimi</div>
          <div className='text-1xl leading-tight'>Custom</div>
          <div className='text-1xl leading-tight'>Construction</div>
        </div>
      </header>

      <main>
        <div className='landing-page-container'>
          <div className='landing-page-overlay'></div>
          <div className='h-screen w-screen bg-cover bg-center bg-no-repeat flex items-center justify-center text-white z-10 relative'>
            <div className='title-container'>
              <h1 className='title-main'>Rahimi Custom Construction</h1>
              <div className='title-sub'>
                Expert Custom Woodworking & Renovations in Knoxville, TN
              </div>
            </div>
          </div>
        </div>
        <div className='services-container-with-overlay'>
          <div className='absolute inset-0 bg-slate-950 opacity-60'></div>

          <div className='relative z-10'>
            {/* Who We Are Section - Centered */}
            <div className='text-center text-white max-w-3xl mx-auto mb-8 px-4 pb-8'>
              <h2 className='text-4xl font-bold mb-4'>
                Custom Home Renovations & Woodworking Services in Knoxville, TN
              </h2>
              <p className='text-lg leading-relaxed'>
                At Rahimi Custom Construction, we specialize in bringing your
                home improvement dreams to life through exceptional
                craftsmanship and innovative design in Knoxville, TN, and
                surrounding areas. With years of experience in custom
                woodworking, home renovations, and bespoke interior design
                services, our team is committed to making your home a true
                reflection of your vision. Whether you are looking for a
                complete home renovation, custom cabinetry, or unique home
                features, we proudly serve Knoxville and the surrounding areas
                with unmatched quality and dedication.
              </p>
            </div>
            {/* Service Icons Section */}
            <div className='relative z-10 flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-6'>
              <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                <div className='service-icon'>
                  <Image
                    src='/icons/custom-woodworking.png'
                    width={128} // You can adjust this to your desired width
                    height={128} // Adjust this to match your layout
                    className='object-contain w-24 h-24 md:w-32 md:h-32'
                    alt='Custom woodworking services in Knoxville, TN'
                  />
                </div>
                <div className='service-main mt-2'>Woodworking</div>
                <div className='service-sub text-center'>
                  Crafting exceptional custom woodworking that adds character
                  and timeless beauty to your home.
                </div>
              </div>

              <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                <div className='service-icon'>
                  <Image
                    src='/icons/custom-design.png'
                    width={128} // Adjust width
                    height={128} // Adjust height
                    className='object-contain w-24 h-24 md:w-32 md:h-32'
                    alt='Custom home design services in Knoxville, TN'
                  />
                </div>
                <div className='service-main mt-2'>Design</div>
                <div className='service-sub text-center'>
                  Bringing your vision to life with innovative, functional
                  designs tailored to your unique style and needs.
                </div>
              </div>

              <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                <div className='service-icon'>
                  <Image
                    src='/icons/home-renovation.png'
                    width={128} // Adjust width
                    height={128} // Adjust height
                    className='object-contain w-24 h-24 md:w-32 md:h-32'
                    alt='Home renovation services in Knoxville, TN'
                  />
                </div>
                <div className='service-main mt-2'>Renovations</div>
                <div className='service-sub text-center'>
                  Transforming spaces with expert renovations that enhance both
                  form and function, making your home a reflection of your
                  dreams.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='detailed-services-container-with-overlay'>
          <div className='absolute inset-0 bg-slate-950 opacity-60'></div>
          <div className='relative z-10'>
            {/* What We Do Section */}
            <div className='text-center text-white max-w-3xl mx-auto mb-8 px-4 pb-8'>
              <h2 className='text-4xl font-bold mb-4'>
                Expert Woodworking Services
              </h2>
              <p className='text-lg leading-relaxed'>
                Rahimi Custom Construction offers a range of custom solutions to
                elevate your home&apos;s functionality, style, and value.
                Specializing in custom home renovations, woodworking, and
                outdoor living spaces, we proudly serve Knoxville, TN.
              </p>
            </div>
            {/* Section 1 - Indoor Enhancements */}
            <div className='text-center text-white mb-8 pt-16'>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 justify-center items-stretch '>
                <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                  <div className='service-icon'>
                    <Image
                      src='/icons/custom-stairs-and-railings.png'
                      width={128} // Adjust size as needed
                      height={128} // Adjust size as needed
                      className='object-contain w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 max-w-full'
                      alt='Custom stairs and railings for Knoxville homes'
                    />
                  </div>
                  <div className='service-main mt-2'>Stairs & Railings</div>
                  <div className='service-sub text-center'>
                    Elevate your home&apos;s interior with expertly designed and
                    crafted staircases and railings, offering both safety and
                    style.
                  </div>
                </div>

                <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                  <div className='service-icon'>
                    <Image
                      src='/icons/custom-bookshelves-cabinets-shelves.png'
                      width={128} // Adjust to your required size
                      height={128} // Adjust to your required size
                      className='object-contain w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 max-w-full'
                      alt='Custom bookshelves, cabinets, and shelves for Knoxville homes'
                    />
                  </div>
                  <div className='service-main mt-2'>
                    Custom Cabinets, Shelves, or Bookcases
                  </div>
                  <div className='service-sub text-center'>
                    Professionally designed and built custom cabinetry and
                    shelving solutions tailored for your home, providing both
                    beauty and functionality.
                  </div>
                </div>

                <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                  <div className='service-icon'>
                    <Image
                      src='/icons/gazebo.png'
                      width={128} // Adjust to your required size
                      height={128} // Adjust to your required size
                      className='object-contain w-24 h-24 md:w-32 md:h-32'
                      alt='Custom gazebos and pergolas in Knoxville'
                    />
                  </div>
                  <div className='service-main mt-2'>Gazebo & Pergola</div>
                  <div className='service-sub text-center'>
                    Custom-built outdoor structures to enhance your backyard
                    living experience, perfect for entertaining and relaxation.
                  </div>
                </div>

                <div className='flex flex-col items-center text-center max-w-xs mx-auto'>
                  <div className='service-icon'>
                    <Image
                      src='/icons/descks-porches.png'
                      width={128} // Adjust to your required size
                      height={128} // Adjust to your required size
                      className='object-contain w-24 h-24 md:w-32 md:h-32'
                      alt='Custom deck, porch, and balcony designs for Knoxville homes'
                    />
                  </div>
                  <div className='service-main mt-2'>
                    Deck, Porch, or Balcony
                  </div>
                  <div className='service-sub text-center'>
                    Expand your living space with a custom-built outdoor deck,
                    porch, or balcony, designed to suit your needs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Gallery Section */}
        <HomeGallery></HomeGallery>

        <div className='contact-us-container'>
          <div className='absolute inset-0 bg-stone-800 opacity-70'></div>

          <div className='relative flex flex-col md:flex-row justify-between items-center w-full max-w-6xl'>
            {/* Left side - Email and Phone Number */}
            <div className='w-full md:w-1/2 text-white text-left mb-8 md:mb-0 md:pr-8'>
              <h2 className='text-2xl font-bold mb-4'>Get in Touch</h2>
              <p className='mb-2 text-lg'>
                <strong>Email:</strong> rahimillc123@gmail.com
              </p>
              <p className='mb-2  text-lg'>
                <strong>Phone:</strong> +1-703-341-9507
              </p>
            </div>

            {/* Centered Form */}
            <div className='w-full md:w-1/2'>
              <form
                id='contactForm'
                action='/api/send-contact-us-email'
                method='POST'
                className='bg-transparent text-white p-6 shadow-md rounded-md'
              >
                <div className='mb-6'>
                  <label
                    htmlFor='name'
                    className='block text-sm text-white font-bold mb-2'
                  >
                    Name
                  </label>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    className='w-full p-3 text-black border rounded'
                    required
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='email'
                    className='block text-sm text-white font-bold mb-2'
                  >
                    Email
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    className='w-full p-3 text-black border rounded'
                    required
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-bold mb-2'
                  >
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    className='w-full p-3 text-black border rounded'
                    required
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='message'
                    className='block text-sm font-bold mb-2'
                  >
                    Message
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    className='w-full p-3 text-black border rounded'
                    rows='5'
                    required
                  ></textarea>
                </div>
                <button
                  type='submit'
                  id='submitButton'
                  className='w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700'
                >
                  Send Message
                </button>
              </form>

              <script
                dangerouslySetInnerHTML={{
                  __html: `
        document.getElementById('contactForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          const formData = new FormData(e.target);
          const formObject = {};
          formData.forEach((value, key) => {
            formObject[key] = value;
          });

          const submitButton = document.getElementById('submitButton');
          submitButton.disabled = true;
          submitButton.innerHTML = '<div class="loader"></div> Sending...';

          try {
            const response = await fetch('/api/send-contact-us-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formObject),
            });

            if (response.ok) {
              submitButton.innerHTML = 'Message Sent';
              submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
              submitButton.classList.add('bg-green-600');
              e.target.reset();
            } else {
              const { error } = await response.json();
              alert(error || 'Failed to send message. Please try again.');
              submitButton.disabled = false;
              submitButton.innerHTML = 'Send Message';
            }
          } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Send Message';
          }
        });
      `,
                }}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className='bg-slate-800 text-white py-4 text-center'>
        <p className='text-sm'>
          © {new Date().getFullYear()} Rahimi Custom Construction, Knoxville,
          TN. All rights reserved.
        </p>
        <p className='text-xs mt-2'>
          Proudly serving Knoxville and the surrounding areas with quality
          craftsmanship.
        </p>
      </footer>
    </div>
  );
}
