import "@/styles/globals.css";
import "@mantine/core/styles.css";
import { MantineProvider, createTheme } from "@mantine/core";
import Layout from "@/components/Layout";

const theme = createTheme({
  primaryColor: 'dark',
  defaultRadius: 'md',
  fontFamily: 'Inter, sans-serif',
});

export default function App({ Component, pageProps }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MantineProvider>
  );
}
