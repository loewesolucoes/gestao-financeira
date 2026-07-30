import moment from "moment";
import { DateUtil } from "../date";

describe("DateUtil.generateGreetings", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function setHour(hour: number) {
    jest.useFakeTimers();
    jest.setSystemTime(moment().hour(hour).minute(0).second(0).toDate());
  }

  it("retorna 'Bom dia' entre 03h e 11h59", () => {
    setHour(3);
    expect(DateUtil.generateGreetings()).toBe("Bom dia");

    setHour(11);
    expect(DateUtil.generateGreetings()).toBe("Bom dia");
  });

  it("retorna 'Boa tarde' entre 12h e 17h59", () => {
    setHour(12);
    expect(DateUtil.generateGreetings()).toBe("Boa tarde");

    setHour(17);
    expect(DateUtil.generateGreetings()).toBe("Boa tarde");
  });

  it("retorna 'Boa noite' entre 18h e 23h59", () => {
    setHour(18);
    expect(DateUtil.generateGreetings()).toBe("Boa noite");

    setHour(23);
    expect(DateUtil.generateGreetings()).toBe("Boa noite");
  });

  it("retorna 'Boa noite' entre 00h e 02h59 (madrugada)", () => {
    setHour(0);
    expect(DateUtil.generateGreetings()).toBe("Boa noite");

    setHour(2);
    expect(DateUtil.generateGreetings()).toBe("Boa noite");
  });
});
