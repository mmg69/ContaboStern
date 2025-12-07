// pages/_app.js
import '../styles/globals.css';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function MyApp({ Component, pageProps }) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: 'MXN',
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <Component {...pageProps} />
    </PayPalScriptProvider>
  );
}
