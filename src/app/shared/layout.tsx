"use client";

import BigNumber from "bignumber.js";
import { AppProviders } from "../contexts";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import "moment/locale/pt-br";
import moment from "moment";

import 'chart.js/auto';
import { BottomNavbar } from "../components/bottom-navbar";
import { Notifications } from "../components/notifications";
import { ErrorHandler } from "./error-handler";
import { HeaderSidebar } from "../components/header-sidebar";
import { Chart } from 'chart.js';

if (typeof window !== 'undefined') {
  const zoomPlugin = require('chartjs-plugin-zoom').default || require('chartjs-plugin-zoom');

  Chart.register(zoomPlugin);
}

BigNumber.config({
  FORMAT: {
    // decimal separator
    decimalSeparator: ',',
    // grouping separator of the integer part
    groupSeparator: '.',
  }
});

moment().locale('pt-br')

export function Layout({ children, noHeader }: any) {
  return (
    <ErrorHandler noHeader={noHeader}>
      <AppProviders>
        {noHeader ? null : <Header />}
        <div className="d-flex">
          {noHeader ? null : <HeaderSidebar />}
          <div className="d-flex flex-column flex-grow-1 real-body">
            {children}
            <Footer />
          </div>
        </div>
        {noHeader ? null : <BottomNavbar />}
        <Notifications />
      </AppProviders>
    </ErrorHandler>
  );
}

