import React from 'react';
import App, { Container } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'styled-components';

import theme from '@codesandbox/common/lib/theme';
import Navigation from '@codesandbox/common/lib/components/Navigation';
import Footer from '@codesandbox/common/lib/components/Footer';
import '../css/typography.css';
import '../css/global.css';

export default class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={theme}>
        <>
          <Head>
            <title>
              CodeSandbox: Online Code Editor Tailored for Web Application
              Development
            </title>
          </Head>
          <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 20 }}>
            <Navigation />
          </div>
          <Container>
            <Component {...pageProps} />
          </Container>
          <Footer />
        </>
      </ThemeProvider>
    );
  }
}
