import moment from "moment";


export class DateUtil {
  public static generateGreetings() {
    const currentHour = Number(moment().format("HH"));

    if (currentHour >= 3 && currentHour < 12) {
      return "Bom dia";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Boa tarde";
    } else if (currentHour >= 18 || currentHour < 3) {
      return "Boa noite";
    } else {
      return "Bem vindo";
    }
  }
}