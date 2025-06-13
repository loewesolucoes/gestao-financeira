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

BigNumber.config({
  FORMAT: {
    // decimal separator
    decimalSeparator: ',',
    // grouping separator of the integer part
    groupSeparator: '.',
  }
});

moment().locale('pt-br')

export function Layout({ children }: any) {
  return (
    <AppProviders>
      <Header />
      {children}
      <Footer />
      <BottomNavbar />
      <Notifications />
    </AppProviders>
  );
}

