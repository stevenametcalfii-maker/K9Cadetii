import Head from 'next/head';

/**
 * Home page for the United Pets application.
 *
 * This page serves as a simple placeholder.  You should replace the
 * contents of this file with your own React components to implement
 * the design described in the project brief.  You can access Supabase
 * via the client exported from `lib/supabase.js`.
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>United Pets</title>
        <meta name="description" content="United Pets veterinary and pet services" />
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Welcome to United Pets</h1>
        <p>
          This is the starter frontend for the United Pets website.  Build out
          your pages under the <code>frontend/pages/</code> directory and export
          the site using <code>npm run build:static</code>.
        </p>
      </main>
    </>
  );
}
