"use client";

import BigNumber from "bignumber.js";
import { AppProviders } from "../contexts";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import "moment/locale/pt-br";
import moment from "moment";

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
    </AppProviders>
  );
}